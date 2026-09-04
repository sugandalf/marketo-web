## Context

See proposal.md (Why) and `specs/bot-performance/spec.md` for behavior. Live horses on `/` and `/program` come from `loadField` in `$lib/server/roster.ts`: entered `bot` rows plus request-time `purseFor` (seed + deposits − withdrawals) and `fights: []`. Demo heroes in `$lib/landing/heroes.ts` still supply labeled SYNTHETIC past performances. The example DreamDEX bot already marks one vault’s idle + inventory PnL in `examples/dreamdex-vault-bot/src/pnl.ts` (logs only, one `VAULT_ADDRESS`, operator key for writes). SQLite is Drizzle + `better-sqlite3` (`src/lib/server/db/schema.ts`); amounts in existing tables are native-unit text. `$lib/server` must not be imported from the client. Chain stays source of truth; SQLite is a lagging projection.

## Goals / Non-Goals

**Goals:**

- One Bun long-running process that, on an interval, reads every entered vault and upserts SQLite snapshots + fight rows.
- One server-load path: `loadField` attaches stored TVL, PnL, and fights onto live `Hero`s. Pages keep the existing racing-form fields (`fights`, `vaultUsdso`, `heroPnl`).
- Read-only indexer: viem public client + markets SDK; no wallet, no operator key, no vault writes.
- Amounts as `bigint` on chain and integer strings in SQLite; display formatting stays at the load/UI boundary.

**Non-Goals:**

- Changing deposit/withdraw persist or last-backer (those stay queries of existing tables).
- Redesigning `/` or `/program` layout.
- Importing the trading bot’s `.state` files or operator key.
- Time-series history of TVL (only latest snapshot + fight list).

## Decisions

### 1. Product CLI, shared schema, separate DB open

Add `src/lib/server/performance/` (cycle, mark, persist) and a Bun entry `src/lib/server/performance/cli.ts` wired as `bun run bot:performance`. The CLI loads `.env` (`DATABASE_URL`, RPC, optional indexer URL, `STATS_INTERVAL_MS` default `30000`). It opens its own connection on `DATABASE_URL` with WAL and imports table defs from `schema.ts` only — it MUST NOT import `$lib/server/db/index.ts` (SvelteKit `$env`). Kit keeps using `better-sqlite3` via `db`. The CLI uses `bun:sqlite` (drizzle `bun-sqlite`) because Bun panics on the `better-sqlite3` NAPI addon; both talk to the same SQLite file.

**Alternative:** Fold into `examples/dreamdex-vault-bot`. Rejected — that process is one vault plus operator writes. **Alternative:** Aggregate inside SvelteKit `load`. Rejected — spec forbids request-time aggregation and RPC for these figures.

### 2. Two projection tables

`bot_stats` (one row per vault on a chain): `chain_id`, `vault_address` (unique together), `tvl_assets`, `pnl_assets`, `realized_pnl_assets`, `unrealized_pnl_assets` (nullable text when mark is missing), `updated_at`. TVL = idle ERC-20 `balanceOf(vault)` + sum of marked outcome inventory. PnL = realized + unrealized when mark exists, else realized only.

`bot_fight` (one row per vault + `market_id`): `chain_id`, `vault_address`, `market_id` (unique together), `date` (ISO date), `window` (`15m` | `1h`), `market` (`BTC` | `ETH`), `side` (`up` | `down`), `pnl_assets`, `settled_at`. Never delete fight rows; upsert on `(vault_address, market_id)`.

Native units as text, same as `deposit.assets`. Generate with `bun run db:generate`, apply with `bun run db:migrate` (local may `db:push`).

**Alternative:** JSON blob of fights on the snapshot row. Rejected — tote/overlay need a queryable list. **Alternative:** TVL = seed + deposits − withdrawals. Rejected — that is ledger, not vault inventory.

### 3. Per-vault transaction; skip partial writes

Each cycle: `getChainId()`; if not the product chain, log and write nothing. Then for each `bot` row: read mark → in one SQLite transaction upsert `bot_stats` and any settled fights. On read failure, skip that vault (leave previous rows). Do not wrap the whole roster in one transaction.

Market discovery: Somnia markets SDK `getOpenPositionsWithPnL(vault)` plus per-market `getBinaryPositionPnL` / on-chain book mark, same fallback idea as `pnl.ts`, without copying write helpers. Do not use the trading bot `.state`. Resolved or voided markets become fights (window/underlying from market metadata; side from winning outcome, or from the larger YES/NO inventory on void). Keep fights after inventory is redeemed; refresh PnL when the indexer still returns the market.

**Alternative:** Scan factory/vault logs every cycle. Rejected for v1 — too heavy; SDK + prior fight keys are enough.

### 4. Load queries projections; `heroPnl` prefers stored PnL

`$lib/server/performance/store.ts` (Kit-side, uses `db`): `listBotStats()`, `listBotFights()`. `horseFromBot` sets `vaultUsdso` from `bot_stats.tvl_assets` (or `0` if missing), `fights` from `bot_fight` newest-first, and `pnlUsdso` from `bot_stats.pnl_assets`. Remove `purseFor`. Do not read RPC in `loadField` for TVL/PnL (asset decimals for display MAY stay; if that read fails, format with the configured token decimals). `heroPnl(hero)` uses `pnlUsdso` when set (live snapshot), else sums `fights` (synthetic). Homepage bench/call and program tote/overlay keep consuming `Hero`; show SYNTHETIC on PP/PnL/purse only when `!hero.live`. `/portfolio` may reuse `loadField` horse fields; depositor book PnL stays out of scope.

**Alternative:** Pages fetch `/api/stats`. Rejected — Kit load is enough.

### 5. No keys in the command

CLI config is RPC, `DATABASE_URL`, interval, optional indexer URL. Refuse to read `OPERATOR_PRIVATE_KEY`. Public client only.

## Risks / Trade-offs

- **[Stale sheets]** Indexer down → live horses show last snapshot or empty/zero. → Document that `bot:performance` must run beside the app; do not reintroduce `purseFor` as a fallback.
- **[SDK miss on redeemed markets]** Settled fights might not appear if the indexer drops closed positions. → Persist fights once seen; re-query stored `market_id`s each cycle.
- **[SQLite lock]** Kit and CLI share one file. → WAL + short per-vault transactions.
- **[Mark vs NAV gap]** Book mid can be null. → Store TVL as idle-only and PnL as realized-only; leave `unrealized_pnl_assets` null rather than inventing a mark.

## Migration Plan

1. Add tables, generate/apply Drizzle migration.
2. Ship CLI + `package.json` script + `.env.example`.
3. Switch `loadField` to projections (live purse may go to 0 until the first successful cycle).
4. Rollback: revert roster mapping and stop the CLI; tables can remain unused.

## Open Questions

- Whether the markets SDK exposes a closed-position history query we should prefer over re-reading stored `market_id`s (does not change the spec or table shape).
