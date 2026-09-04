## Context

See proposal.md (Why) and `specs/bot-depositor/spec.md` for behavior. `/`, `/program`, and `/portfolio` already stamp Deposit, but homepage/program only set `depositIntent` and `/portfolio` mutates `sessionStorage` via `applyDeposit`. Entered bots live in SQLite (`bot`) after a verified `createVault`. Deployed `BotVault` is ERC-4626 (`deposit(assets, receiver)`), with `maxDeposit` capped from creator seed × factory `depositCapBps` (owner is uncapped). Writes stay user-signed in the browser; `$lib/server` is never imported from client modules. Reuse the enter-page wallet session (product chain, `ConnectGate`, `switchToProductChain`).

## Goals / Non-Goals

**Goals:**

- One client write path used by all three slips: switch chain → optional ERC-20 `approve` to the **vault** → user-signed `deposit` → wait for receipt → decode `Deposit`.
- One server persist path: verify that receipt on Somnia RPC against an existing `bot` row, then insert a Drizzle deposit row. Amounts are `bigint` on chain and decimal strings in SQLite.
- Load entered bots (and deposit projections) onto `/`, `/program`, and `/portfolio` so stamps have vault targets and the book can mark BACKED.
- Deposit lifecycle as a discriminated union (`idle` / `wrong_network` / `approving` / `pending` / `confirmed` / `rejected` / `reverted` / `rpc_error` / `cap_exceeded` / `not_live`), derived into the existing slips without a second form.

**Non-Goals:**

- Redesigning the three slips or naming Somnia in racing-form copy (wallet switch UI may show the network).
- Wiring withdraw/redeem/claim, or replacing the synthetic demo roster.
- Sharing this helper back into `createVault` beyond the existing error classifier.
- Reading full factory vault indexes from chain (SQLite `bot` remains the entered-horse index).

## Decisions

### 1. Shared write helper; three pages call it

Add `$lib/chain/depositVault.ts` wrapping wagmi `readContract` / `simulateContract` / `writeContract` / `waitForTransactionReceipt`. Pages keep their layout; they pass `{ vault, amountRaw }` and a phase callback. Do not copy the approve/deposit sequence into each `+page.svelte`.

Generalize `classifyWriteError` in `$lib/chain/lifecycle.ts` so deposit and createVault share reject/revert/RPC mapping. Add deposit-only phases `cap_exceeded` and `not_live` on the page, not as chain-throw types for wallet errors.

**Alternative:** Three independent write copies. Rejected — the spec requires identical deposit behavior.

### 2. Vault ABI is ERC-4626 plus BotVault errors

New `$lib/chain/botVault.ts` with the functions this flow needs: `deposit`, `maxDeposit`, `asset`, `previewDeposit`, and the `Deposit` event, plus errors `InvalidAmount` and `DepositCapExceeded`. Do not import the full BotVault source. `asset()` MUST equal `chainConfig.assetAddress` before approve/deposit; mismatch is `rpc_error` / configuration failure.

`assets = parseUnits(amountRaw, decimals)`. `receiver = connected address`. Read `maxDeposit(receiver)` first; if `assets === 0n` stay on the slip; if `assets > maxDeposit` set `cap_exceeded` and do not send.

**Alternative:** Recompute cap from `principalOf(owner)` × `depositCapBps`. Rejected — `maxDeposit` is the protocol view.

### 3. Approve the vault, exact assets

Read `allowance(owner, vault)`. If below `assets`, `approve(vault, assets)` and wait. Then `simulateContract` `deposit` and `writeContract`. Decode `Deposit` from logs (`sender`, `owner`/`receiver`, `assets`, `shares`). Exact approve, same rationale as enter: the amount is known.

**Alternative:** Infinite approve. Rejected. **Alternative:** Approve the factory. Rejected — `deposit` pulls to the vault.

### 4. Client signs; server verifies; one persist endpoint

After a successful receipt, `POST` JSON to `src/routes/deposit/+server.ts` (shared mutation for three pages; not a resource collection). The handler in `$lib/server/deposits.ts`:

1. Validates checksummed addresses, chain id, `assets` and `shares` as base-10 integer strings, tx hash.
2. Requires a `bot` row for `vaultAddress` on this chain with matching `assetAddress`.
3. `publicClient.getTransactionReceipt` on Somnia.
4. Requires `status === "success"`, `to` = vault (or the vault appears in logs if the call is a proxy), and a `Deposit` log whose `sender`, `owner`, `assets`, and `shares` match the body (`owner` = depositor/receiver).
5. Inserts the row. Unique on `tx_hash`; conflict returns the existing row (idempotent retry).

**Alternative:** Trust the client and insert without RPC verify. Rejected — spoofed backer rows would appear on the book. **Alternative:** Three colocated POSTs. Rejected — same mutation. **Alternative:** Kit form action. Rejected — the write is wallet-signed JSON.

### 5. Drizzle `deposit` table (keep `bot` and `task`)

| Column              | Role                                        |
| ------------------- | ------------------------------------------- |
| `id`                | UUID PK                                     |
| `chain_id`          | 50312                                       |
| `vault_address`     | checksummed; must match `bot.vault_address` |
| `depositor_address` | `Deposit.owner` / receiver                  |
| `sender_address`    | `Deposit.sender`                            |
| `asset_address`     | configured ERC-20                           |
| `assets`            | native units as text (`bigint`)             |
| `shares`            | native units as text (`bigint`)             |
| `tx_hash`           | unique                                      |
| `created_at`        | unix ms                                     |

Do not store floats. Generate via `bun run db:generate` and apply with `bun run db:migrate` (local may `db:push`).

### 6. Server-load entered bots; filter book by connected wallet

Add `$lib/server/bots.ts` list helper (or a sibling) and `+page.server.ts` on `/`, `/program`, and `/portfolio` that return entered bots plus deposit rows (public projection). Map a bot to the existing `Hero` shape with `id` = vault address and a live flag. Merge live horses ahead of the synthetic demo roster; synthetic ids stay non-depositable.

Wallet address is client-only. `/portfolio` filters deposit rows where `depositor_address` equals the connected wallet after connect. Sum `assets` per vault for BACKED capital; last-backer on `/program` is the latest deposit row for that vault. If a later chain read of `balanceOf` / `convertToAssets` disagrees, do not present the projection as settled fact (show SYNTHETIC or omit the conflicting figure).

Do not call `applyDeposit` / `saveBook` for live vaults. Demo sessionStorage book may remain for synthetic horses only.

**Alternative:** Client-only `sessionStorage` entered horse as the sole live target. Rejected — other devices and `/program` would not see depositable vaults.

### 7. Copy and amounts

All new strings go through Paraglide (`en`/`id`). Sheet copy stays generic (“wrong network”, “rejected”, “reverted”, “cap reached”, “not a live vault”). Format USDso with `formatUnits`; never `Number` for chain args. Disable the stamp while `approving` / `pending`. Keep `deposit-stamp.webp`.

## Risks / Trade-offs

- **[Risk] Client POSTs a foreign hash.** → Server checks receipt + `Deposit` vs body and requires an existing `bot` vault; insert only on match.
- **[Risk] `maxDeposit` is 0 for backers when seed is 0.** → Cap-exceeded / not depositable; creator seed remains an enter-page concern.
- **[Risk] Approve succeeds, `deposit` rejected.** → Allowance remains; next stamp skips approve. Acceptable.
- **[Risk] SQLite down after confirmation.** → Slip still shows confirmed from the receipt; POST retry is idempotent; do not un-confirm the UI.
- **[Risk] Proxy `receipt.to` is not the vault.** → Accept a matching `Deposit` log whose `address` is the vault.
- **[Trade-off] Projection sum vs live `balanceOf`.** Index from SQLite; treat chain balances as truth when they are read.
- **[Trade-off] Exact approve vs infinite.** Exact is safer; a later larger deposit needs a new approve.

## Migration Plan

1. Generate and apply the `deposit` table; leave `bot` and `task` in place.
2. Ship shared write/persist helpers, then wire the three existing slips (no dual UI).
3. Rollback: revert route/helper changes; SQLite `deposit` rows can remain (projection only). Do not attempt to undo on-chain deposits.

## Open Questions

- None. Factory `depositCapBps` is read via vault `maxDeposit`; production USDso remains the existing env asset.
