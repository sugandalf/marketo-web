## 1. SQLite projections

- [x] 1.1 Add `bot_stats` and `bot_fight` tables in `src/lib/server/db/schema.ts` per design.md (keep `bot`, `deposit`, `withdrawal`, `task`). Amounts as text native units; unique `(chain_id, vault_address)` and `(vault_address, market_id)`.
- [x] 1.2 Run `bun run db:generate` and apply with `bun run db:migrate` (or `bun run db:push` locally) so the tables exist.

## 2. Kit read helpers and Hero mapping

- [x] 2.1 Add `$lib/server/performance/store.ts` with `listBotStats()` and `listBotFights()` using the SvelteKit `db`. Do not aggregate deposits/withdrawals.
- [x] 2.2 Extend `Hero` with optional `pnlUsdso`. Change `heroPnl` to use `pnlUsdso` when set, else sum `fights`. Map fights newest-first.

## 3. Indexer CLI (read-only)

- [x] 3.1 Add `src/lib/server/performance/cli.ts` plus config: load `.env`, require `DATABASE_URL` and RPC, default `STATS_INTERVAL_MS=30000`, optional indexer URL. Open a separate better-sqlite3 client with WAL; import `schema.ts` only (never `$lib/server/db/index.ts`). Do not read `OPERATOR_PRIVATE_KEY`.
- [x] 3.2 Add `package.json` script `bot:performance` and document env in `.env.example` and the example/README that this process must run beside the app.

## 4. Aggregate cycle

- [x] 4.1 Implement vault mark: idle ERC-20 `balanceOf(vault)` + SDK `getOpenPositionsWithPnL` / per-market PnL with on-chain book fallback (same idea as `examples/dreamdex-vault-bot/src/pnl.ts`). Public client only. Map resolved/voided markets to fight fields (date, window, BTC|ETH, up|down, pnl). Re-read stored `market_id`s so redeemed fights are not dropped.
- [x] 4.2 Each cycle: skip all writes if RPC chain id is not the product chain. For each entered `bot`, on success upsert `bot_stats` + fights in one transaction; on failure leave that vault unchanged and continue. SIGINT/SIGTERM stop the loop.

## 5. Pages query SQLite only

- [x] 5.1 Change `horseFromBot` / `loadField` to set `vaultUsdso`, `fights`, and `pnlUsdso` from `bot_stats` / `bot_fight` (zero/empty if missing). Remove `purseFor`. Do not call RPC to compute TVL or PnL on load. Last-backer may still come from deposit rows.
- [x] 5.2 On `/` and `/program`, show SYNTHETIC on past performances, PnL, and purse only when the horse is not live. Keep layout; program sort by PnL/purse uses stored `heroPnl` / `vaultUsdso`.

## 6. Verify

- [x] 6.1 Run `bun run check` and `bun run format` (then `bun run lint`) on touched files; fix type and format issues.
- [x] 6.2 Manual pass: start `bun run bot:performance` against local.db with entered bots; confirm SQLite `bot_stats` / `bot_fight` after a cycle; SIGINT exits; wrong RPC chain writes nothing; `/` bench/call and `/program` tote/overlay show stored fights, PnL, and purse without summing deposits; live horses are not labeled SYNTHETIC; a live horse with no snapshot shows empty fights and zero purse; synthetic demo horses stay labeled SYNTHETIC. No wallet write required.
