## Context

See proposal.md (Why) and the delta specs under `specs/bot-depositor/` and `specs/bot-creator/` for behavior. `/portfolio` already chips WITHDRAW and calls `applyWithdraw` / `saveBook`, but that path is gated to synthetic horses (`canWithdraw` requires `!hero.live`). Live deposit already uses a user-signed helper, `/deposit` persist, and SQLite `deposit` rows. Writes stay user-signed in the browser; `$lib/server` is never imported from client modules. Reuse the portfolio wallet session (product chain, `ConnectGate`, `switchToProductChain`).

## Goals / Non-Goals

**Goals:**

- One client write path for `/portfolio`: switch chain → user-signed `withdraw` → wait for receipt → decode `Withdraw`.
- One server persist path: verify that receipt on Somnia RPC against an existing `bot` row, then insert a Drizzle withdrawal row. Amounts are `bigint` on chain and decimal strings in SQLite.
- Remaining book NAV from net deposit/withdrawal projections, with the open overlay’s max amount taken from chain `maxWithdraw(owner)`.
- Withdraw lifecycle as a discriminated union (`idle` / `wrong_network` / `pending` / `confirmed` / `rejected` / `reverted` / `rpc_error` / `exceeds_max` / `not_live`), derived into the existing outlined Withdraw without a second form.

**Non-Goals:**

- Redesigning the book tote, naming Somnia in racing-form copy, or adding Withdraw to `/` and `/program`.
- Wiring `redeem(shares, …)` as the slip action, or adding ERC-20 `approve`.
- Sharing this helper back into `deposit` / `createVault` beyond the existing error classifier.
- Replacing the synthetic demo roster; synthetic withdraw may keep `applyWithdraw`.

## Decisions

### 1. Asset-denominated `withdraw`; owner is the connected wallet

The slip amount is USDso. Call ERC-4626 `withdraw(assets, receiver, owner)` with `assets = parseUnits(amountRaw, decimals)` and `receiver = owner = connected address`. Do not call `redeem`. Do not take a third-party `owner`.

Read `maxWithdraw(owner)` first. If `assets === 0n` stay on the slip; if `assets > maxWithdraw` set `exceeds_max` and do not send. Verify vault `asset()` equals `chainConfig.assetAddress`.

**Alternative:** `redeem` of estimated shares. Rejected — the field is assets; converting in the client would drift. **Alternative:** Permit `owner` ≠ signer. Rejected — that is how an operator could pull depositor funds.

### 2. Shared write helper; only `/portfolio` calls it

Add `$lib/chain/withdrawVault.ts` wrapping wagmi `readContract` / `simulateContract` / `writeContract` / `waitForTransactionReceipt`. The page passes `{ vault, amountRaw }` and a phase callback (`pending` only). No `approve`.

Add `$lib/chain/withdrawFlow.ts` mirroring `stampDeposit` (spectator / wrong network / not live / persist after confirm). Reuse `classifyWriteError`. Add withdraw-only page phases `exceeds_max` and `not_live`.

Extend `$lib/chain/botVault.ts` with `withdraw`, `maxWithdraw`, `previewWithdraw`, `convertToAssets`, `balanceOf`, the `Withdraw` event, and errors `InvalidAmount` and `ERC4626ExceededMaxWithdraw`. Keep existing deposit fragments.

**Alternative:** Inline the sequence in `+page.svelte`. Rejected — deposit already extracted a runner; withdraw should match.

### 3. Client signs; server verifies; one persist endpoint

After a successful receipt, `POST` JSON to `src/routes/withdraw/+server.ts`. Handler in `$lib/server/withdrawals.ts`:

1. Validates checksummed addresses, chain id, `assets` and `shares` as base-10 integer strings, tx hash.
2. Requires a `bot` row for `vaultAddress` on this chain with matching `assetAddress`.
3. `publicClient.getTransactionReceipt` on Somnia.
4. Requires `status === "success"` and a `Withdraw` log at the vault whose `sender`, `receiver`, `owner`, `assets`, and `shares` match the body (`owner` = connected withdrawer).
5. Inserts the row. Unique on `tx_hash`; conflict returns the existing row (idempotent retry).

**Alternative:** Trust the client. Rejected — spoofed rows would shrink the book. **Alternative:** Kit form action. Rejected — the write is wallet-signed JSON.

### 4. Drizzle `withdrawal` table (keep `bot`, `deposit`, `task`)

| Column             | Role                                        |
| ------------------ | ------------------------------------------- |
| `id`               | UUID PK                                     |
| `chain_id`         | 50312                                       |
| `vault_address`    | checksummed; must match `bot.vault_address` |
| `owner_address`    | `Withdraw.owner`                            |
| `receiver_address` | `Withdraw.receiver`                         |
| `sender_address`   | `Withdraw.sender`                           |
| `asset_address`    | configured ERC-20                           |
| `assets`           | native units as text (`bigint`)             |
| `shares`           | native units as text (`bigint`)             |
| `tx_hash`          | unique                                      |
| `created_at`       | unix ms                                     |

Do not store floats. Generate via `bun run db:generate` and apply with `bun run db:migrate` (local may `db:push`).

### 5. Book math: net projection on the tote; chain `maxWithdraw` on the slip

Load withdrawal rows with deposits in `loadField()`. Purse TVL = `seedAssets + sum(deposits) - sum(withdrawals)` (floor at 0).

`liveBookEntries` BACKED capital for a wallet = `max(0, sum(that wallet’s deposits) - sum(that wallet’s withdrawals))` for the vault. If remaining is 0 and the wallet is not the creator, drop BACKED.

Do not fold creator seed into that net (seed is not a `deposit` row). On overlay open for a live horse, the client reads `maxWithdraw(connected)` and uses it as the slip maximum and as whether Withdraw is offered. Owner-only stays watch-only when that read is 0. When it is greater than zero, show Withdraw for that owner’s NAV even if the deposit net is 0.

If a later chain read disagrees with the projection, do not present the stale figure as settled fact.

Do not call `applyWithdraw` / `saveBook` for live vaults. Demo sessionStorage withdraw remains for synthetic horses only.

**Alternative:** Sum deposits only (ignore withdrawals). Rejected — the book would not shrink. **Alternative:** N RPC `balanceOf` reads for every tote row. Rejected for this change; overlay-scoped `maxWithdraw` is enough to keep creator seed redeemable without listing-time fan-out.

### 6. Copy and slip wiring

Paraglide (`en`/`id`) for wrong network, switch, pending, rejected, reverted, RPC failure, exceeds max, not a live vault, and confirmed withdraw. Do not name Somnia in sheet copy. Format USDso with `formatUnits`; never `Number` for chain args. Disable Withdraw while `pending`. Keep the 1px outlined Withdraw; do not stamp it. Add a `WithdrawStatus` sibling to `DepositStatus` (withdraw has no approve phase).

Flip live `canWithdraw`: a live horse is withdrawable when the connected wallet’s redeemable assets are greater than zero, not when `!hero.live`.

## Risks / Trade-offs

- **[Risk] Client POSTs a foreign hash.** → Server checks receipt + `Withdraw` vs body and requires an existing `bot` vault; insert only on match.
- **[Risk] `maxWithdraw` is 0 because assets are allocated.** → Exceeds-max / reverted; the slip stays usable. Idle liquidity is a protocol fact.
- **[Risk] Creator seed is invisible in deposit net.** → Overlay `maxWithdraw` gates Withdraw; tote capital for owner-only may stay em dash until that read.
- **[Risk] SQLite down after confirmation.** → Slip still shows confirmed from the receipt; POST retry is idempotent; do not un-confirm the UI.
- **[Risk] Exact USDso vs `maxWithdraw` rounding.** → Compare as `bigint` after `parseUnits`; “All NAV” fills from `formatUnits(maxWithdraw)`, not from the projected float.
- **[Trade-off] Projection net vs live `convertToAssets`.** Index from SQLite; treat chain `maxWithdraw` as truth on the open slip.

## Migration Plan

1. Generate and apply the `withdrawal` table; leave `bot`, `deposit`, and `task` in place.
2. Ship write/persist helpers, then wire the existing `/portfolio` Withdraw (no dual UI).
3. Rollback: revert route/helper changes; SQLite `withdrawal` rows can remain (projection only). Do not attempt to undo on-chain withdraws.

## Open Questions

- None. ERC-4626 `withdraw` / `Withdraw` / `maxWithdraw` are the protocol views; production USDso remains the existing env asset.
