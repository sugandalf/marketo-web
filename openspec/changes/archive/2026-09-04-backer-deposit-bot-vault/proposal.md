## Why

`/`, `/program`, and `/portfolio` already stamp Deposit into a named horse, but the slip never sends a vault write and the book only mutates `sessionStorage`. Entered bots now exist as on-chain `BotVault`s with a SQLite projection; backers still cannot fund them. This change makes a confirmed ERC-4626 `deposit` the meaning of backing a horse, and stores that deposit as a verified SQLite projection.

## What Changes

- On Deposit stamp (homepage slip, program Hot Sheet, portfolio Hot Sheet), the connected wallet signs `deposit(assets, receiver)` on the selected horse’s vault. If allowance is insufficient, the user first signs an ERC-20 `approve` of the configured vault asset **to that vault**.
- `receiver` is the connected wallet. Amounts stay `bigint` native units on chain; the slip still formats USDso.
- Parse the ERC-4626 `Deposit` event from a confirmed receipt. Do not treat a sent hash as success. Honor `maxDeposit` (creator seed × factory deposit cap) before sending.
- Add a Drizzle SQLite table for confirmed deposits (vault, depositor, assets, shares, tx). Persist only after the server verifies the receipt. Chain wins on conflict.
- Load entered `bot` rows onto `/`, `/program`, and `/portfolio` so those stamps have real vault targets. Synthetic demo horses stay visible but cannot complete an on-chain deposit.
- After a confirmed deposit, the backer appears as BACKED on `/portfolio` from the projection, not from `applyDeposit` / sessionStorage.
- Keep existing racing-form slips and the Deposit stamp raster. Add pending / confirmed / rejected / reverted / wrong-network / cap-exceeded states. Add Paraglide copy.

This is **on-chain write + SQLite projection + slip wiring**. No protocol/ABI changes; `BotVault` already implements ERC-4626 `deposit`. Client uses the published vault ABI.

## Non-goals

- Withdraw / redeem / claim of shares.
- Trader allocation or market trades.
- Redesigning the three deposit slips or replacing the synthetic demo roster entirely.
- Custodial or server-submitted `deposit`.
- Changing `createVault` / enter-page papers.

## Capabilities

### New Capabilities

- `bot-depositor`: Backer deposits into an entered bot vault — user-signed ERC-4626 `deposit` on Somnia testnet, ERC-20 allowance to the vault, SQLite projection of confirmed deposits, and the same stamp flow on `/`, `/program`, and `/portfolio` that distinguishes spectator / backer / owner / operator.

### Modified Capabilities

- (none)

## Impact

- **Wallet / chain:** Same product chain as enter (Somnia Shannon Testnet). Wrong network, disconnect, reject, revert (`InvalidAmount`, `DepositCapExceeded`, allowance, insufficient balance), and RPC failure are first-class. The server never holds keys or submits the tx.
- **Funds:** `deposit` pulls the configured ERC-20 from the signer after approve. Shares mint to the connected wallet. Owner seed and operator rights are unchanged; depositing does not make the backer a trader.
- **Code:** Shared deposit helper in `$lib/chain`, vault ABI module, persist endpoint, `src/lib/server/db/schema.ts`, server load of bots/deposits onto the three pages, slip wiring on `src/routes/+page.svelte`, `src/routes/program/+page.svelte`, `src/routes/portfolio/+page.svelte`, `messages/en.json` + `messages/id.json`.
- **Assumptions:** Deposit targets are confirmed `bot` rows (vault address as horse id). `receiver` is the connected address. Exact approve of `assets` to the vault (not the factory). Withdraw stays unwired. Synthetic horses remain browse-only for this write.
