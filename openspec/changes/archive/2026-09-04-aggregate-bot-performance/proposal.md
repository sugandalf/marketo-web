## Why

Homepage past-performances and the `/program` tote already have slots for bot fights, PnL, and vault purse, but live horses ship with empty fights and a request-time purse summed from seed + deposits − withdrawals. Those pages must not aggregate chain or ledger rows on load. A long-running indexer should write SQLite snapshots so the sheets only query stored performance.

## What Changes

- Add a Bun long-running command that periodically walks entered `bot` rows, reads chain (vault TVL / NAV, position PnL, settled fights), and upserts SQLite projections.
- Store per-vault latest TVL and PnL plus a list of past fights (date, window, market, side, PnL) in Drizzle tables. Amounts stay native-unit strings; the UI formats them.
- Change `/` and `/program` load so live-horse fights, PnL, and purse come only from those tables. Drop request-time purse aggregation for live horses. If no snapshot exists, show empty fights and zero/unknown figures — do not fall back to summing deposits or hitting RPC in the page load.
- Keep the existing racing-form layout (homepage bench + call past-performances; program tote PnL/purse columns + overlay past-performances). Drop the SYNTHETIC stamp on live horses that have a snapshot.
- This is **indexing / off-chain**. No contract or ABI changes. The command is read-only: no operator key, no vault writes.

## Non-goals

- Trading, mint, redeem, deposit, or withdraw from this command.
- Replacing the labeled synthetic demo roster.
- Changing `/portfolio` book PnL (depositor holdings), except it may reuse the same live-horse purse/fights if it already shares `loadField`.
- Historical time-series charts or a public stats API.
- Redesigning homepage or program performance UI.

## Capabilities

### New Capabilities

- `bot-performance`: Long-running read-only indexer that periodically aggregates entered-bot TVL, PnL, and past fights into SQLite; `/` and `/program` display those figures by querying the projection only.

### Modified Capabilities

- (none)

## Impact

- **Wallet / chain:** Server-side viem reads on the configured Somnia chain only. No user wallet, no keys, no fund movement. Wrong RPC chain id skips writes to SQLite for that cycle. Chain remains source of truth; SQLite is a lagging projection.
- **Funds:** None. The process never holds an operator key or submits transactions.
- **Code:** New CLI under `examples/` or `$lib/server` + `package.json` script; Drizzle tables in `src/lib/server/db/schema.ts`; roster/`loadField` reads snapshots instead of aggregating; homepage and program sheets consume the same `Hero` fights / `vaultUsdso` / `heroPnl` fields; env interval + RPC (existing). Typecheck with `bun run check`.
- **Assumptions:** Interval from env (default 30s). TVL is vault idle collateral plus marked outcome inventory (NAV), not seed + deposits − withdrawals. A past fight is one resolved or voided market the vault traded. Synthetic heroes stay labeled SYNTHETIC and are not written by the indexer.
