## Context

See proposal.md (Why) and `specs/bot-creator/spec.md` for behavior. `/enter` already collects papers and stamps Open vault, but `commitHero()` only writes `sessionStorage`. Wagmi is injected/EIP-6963 against mainnet with no `chainId`. Drizzle SQLite exists (`task` demo table only). The Somnia factory at `0x6EbBD76076faE4FBaD7C4B5bc9c8c6feeB82e4a9` is verified; `createVault` is nonpayable and emits `VaultCreated`. `OUTCOME_TOKEN` on the factory is not an ERC-20 (name/symbol/decimals revert); the vault `asset` must be a separate configured token. Writes stay user-signed in the browser; `$lib/server` is never imported from client modules.

## Goals / Non-Goals

**Goals:**

- One client write path: switch chain → optional ERC-20 `approve` → user-signed `createVault` → wait for receipt → decode vault address.
- One server persist path: verify that receipt on Somnia RPC, then insert a Drizzle row. Amounts are `bigint` on chain and decimal strings in SQLite.
- Enter-page lifecycle as a discriminated union (`idle` / `wrong_network` / `approving` / `pending` / `confirmed` / `rejected` / `reverted` / `rpc_error`), derived into the existing papers/receipt UI.
- Keep the condition-book layout and Open vault stamp; do not introduce a second form or wizard.

**Non-Goals:**

- Redesigning `/enter` or naming Somnia in the racing-form copy (wallet switch UI may show the network).
- Indexing all factory vaults or replacing the synthetic landing roster.
- Sharing write helpers with deposit/trade flows (those stay later).

## Decisions

### 1. Product chain is a local viem chain, not mainnet

Define Somnia Shannon Testnet (`id: 50312`, native `STT`) in `$lib/wallet/chains.ts` and use it as the sole chain in `walletConfig`. viem does not ship this chain in the current lockfile.

Public env (client-safe, one config module — never scattered across routes):

- `PUBLIC_SOMNIA_RPC_URL`
- `PUBLIC_VAULT_FACTORY_ADDRESS` (default the given factory)
- `PUBLIC_VAULT_ASSET_ADDRESS` (required ERC-20 for `asset` / USDso purse)

Optional private `SOMNIA_RPC_URL` overrides the public RPC on the server only.

**Alternative:** Keep mainnet in wagmi and pass `chainId` only on write. Rejected — wrong-network handling and `switchChain` need the target chain in config.

### 2. Client signs; server verifies; never submits

Enter page (Svelte 5 runes) calls `$lib/chain` helpers that wrap wagmi `readContract` / `simulateContract` / `writeContract` / `waitForTransactionReceipt`. The server has no wallet and no `writeContract`.

After a successful receipt, `POST` JSON to `src/routes/enter/+server.ts` (colocated with the page; this is not a parallel REST resource). The handler:

1. Validates checksummed addresses, chain id, `seedAssets` as a base-10 integer string, market `BTC|ETH`, name/strategy lengths, tx hash.
2. `publicClient.getTransactionReceipt` on Somnia.
3. Requires `status === "success"`, `to` = factory, and a `VaultCreated` log whose `vault`, `owner`, `operator`, `asset`, and `seed` match the body.
4. Inserts the row. Unique on `vault_address` and `tx_hash`; conflict returns the existing row (idempotent retry).

**Alternative:** Trust the client and insert without RPC verify. Rejected — junk or spoofed rows would be presented as entered vaults.

**Alternative:** Kit form action for persist. Rejected — the write is wallet-signed JSON, not a progressive HTML form.

### 3. Drizzle `bot` table (keep `task`)

| Column                                                                                                              | Role                            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `id`                                                                                                                | UUID PK                         |
| `chain_id`                                                                                                          | 50312                           |
| `factory_address`, `vault_address`, `creator_address`, `operator_address`, `asset_address`, `creator_fee_recipient` | checksummed hex                 |
| `name`, `symbol`                                                                                                    | on-chain strings                |
| `market`, `strategy`                                                                                                | papers-only                     |
| `seed_assets`                                                                                                       | native units as text (`bigint`) |
| `performance_fee_bps`                                                                                               | integer, `0`                    |
| `tx_hash`                                                                                                           | create tx                       |
| `created_at`                                                                                                        | unix ms                         |

`vault_address` unique. Do not store floats. Generate via `bun run db:generate` and apply with `bun run db:migrate` (local may `db:push`).

### 4. Approve then createVault

`seedAssets = parseUnits(purse, assetDecimals)`. Read `decimals` and `allowance(owner, factory)` from the asset. If `seedAssets > 0n` and allowance is below that, `writeContract` `approve(factory, seedAssets)` and wait. Then `simulateContract` `createVault` (catches `OperatorExists` / `InsufficientBalance` before send) and `writeContract`. Decode `VaultCreated` from logs; do not treat a hash as success.

Symbol: uppercase `[A-Z0-9]` from the horse name, max 8 chars, fallback `BOT`. `performanceFeeBps = 0`. `creatorFeeRecipient = connected address`.

**Alternative:** Infinite approve. Rejected — seed is known; approve exact amount.

### 5. Wallet session tracks chain

Extend `$lib/wallet/session.svelte.ts` with `chainId` and `switchToProductChain()` (`switchChain`, then `wallet_addEthereumChain` if the chain is unknown). Stamp is disabled while `approving`/`pending`. Existing `ConnectGate` stays for disconnect.

Receipt still calls `saveEnteredHero` so see-on-card works. Horse `id` becomes the vault address (unique, chain-native) instead of a name slug.

### 6. Copy and amounts

All new strings go through Paraglide (`en`/`id`). Sheet copy stays generic (“wrong network”, “rejected”, “reverted”) so the form does not advertise a chain name; the wallet prompt may. Format USDso with `formatUnits`; never `Number` for chain args.

## Risks / Trade-offs

- **[Risk] `PUBLIC_VAULT_ASSET_ADDRESS` unset or wrong token → approve/`createVault` reverts.** → Fail closed at config load; papers show a configuration error instead of sending.
- **[Risk] Factory `OperatorExists` (one vault per operator).** → Simulate first; map the error to reverted copy; papers stay editable.
- **[Risk] Client POST with a foreign/fake hash.** → Server checks receipt + `VaultCreated` vs body; insert only on match.
- **[Risk] Approve succeeds, `createVault` rejected.** → Allowance remains; next stamp skips approve. Acceptable.
- **[Risk] SQLite down after confirmation.** → Receipt still shows from the chain receipt; POST retry is idempotent; do not un-enter the UI.
- **[Trade-off] Exact approve vs infinite.** Exact is safer; a later larger seed needs a new approve.

## Migration Plan

1. Add env vars to `.env` / `.env.example` (RPC, factory, asset).
2. Generate and apply the `bot` table; leave `task` in place.
3. Ship enter wiring behind the same `/enter` route (no dual UI).
4. Rollback: revert the route/wallet changes; SQLite `bot` rows can remain (projection only). Do not attempt to undo on-chain vaults.

## Open Questions

- Production USDso token address on Somnia testnet (env at apply time; does not change specs).
- Whether landing should later load bots from SQLite instead of `sessionStorage` (out of scope).
