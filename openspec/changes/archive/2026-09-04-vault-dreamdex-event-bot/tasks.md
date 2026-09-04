## 1. Scaffold and dependencies

- [x] 1.1 Create `examples/dreamdex-vault-bot/` (`src/`, README, gitignore `.state/`). Add root script `bot:dreamdex` that runs `examples/dreamdex-vault-bot/src/index.ts` with Bun. Document env in `.env.example`: `VAULT_ADDRESS`, `OPERATOR_PRIVATE_KEY`, `DRY_RUN` (default true), `TAKE_INTERVAL_MS`, `TAKE_MAX_SHARES`, `EC_UNDERLYING`, RPC/WS/indexer. Never add the operator key to `PUBLIC_*` or SvelteKit `$env`.
- [x] 1.2 `bun add @somnia-chain/markets-sdk`. Do not add `@dreamdex-bot-kit/ec-core`. Confirm `examples/` does not import `$lib/server` or wagmi connectors.

## 2. Vault adapter (writes only)

- [x] 2.1 Add `src/adapter.ts` with the supplied operator ABI and `createVaultAdapter` (`trader = vault`, `idleCollateral` / `outcomeBalance` / `assetDecimals` against the vault, `snap`, allowed writes only). Export `forbiddenMethods`. Do not wrap `withdraw`, `redeemShares`, `requestRedeem`, `deposit`, or ERC-4626 `mint`.
- [x] 2.2 Wait for receipts on every write. Map missing key (live mode), wrong `eth_chainId` (not 50312), unauthorized operator (view or `simulateContract`), revert, and RPC failure to distinct logs. Amounts stay `bigint`.

## 3. Discover and gates

- [x] 3.1 Add `src/discover.ts`: load live binary windows via markets-sdk **reads** (fallback: `MarketCreated` logs in 1000-block windows). Gate on on-chain status Trading and min time-to-expiry. Do not call `exchange.trader`, `createOrder`, or `mintSet`.
- [x] 3.2 Skip any market whose collateral ≠ `vault.asset()` (checksum). Treat tUSDC (`SOMNIA_TESTNET_ADDRESSES.testUsdc`, 6 decimals) as the hackathon vault and venue token; log a mismatch if they differ. Optional `EC_UNDERLYING` filter.

## 4. Cycle: redeem, mint, take

- [x] 4.1 Persist traded `marketId`s under `examples/dreamdex-vault-bot/.state/` (gitignored). Each cycle: redeem vault-held outcomes on resolved (winner only) or voided (both sides) markets via vault `redeem`. Holder reads use the vault address. Skip redeem when the vault holds none of the claimable side.
- [x] 4.2 For each eligible market: `syncMarket` before first write on that id (ignore no-op revert); mint a complete set once per symbol from vault idle collateral (`snap` to lot, cap `TAKE_MAX_SHARES` and idle balance); `placeOrder` IOC (`orderType = 2`) with tick-snapped `bigint` price. Size sells from vault outcome balance. Skip when idle collateral is below one lot. Track `orderId`s for shutdown cancel.

## 5. Long-running entrypoint

- [x] 5.1 Add `src/index.ts` + `src/cycle.ts`: loop every `TAKE_INTERVAL_MS` (default 8000); `DRY_RUN=true` logs intended mint/order/redeem and sends nothing (key optional); live mode requires key + `VAULT_ADDRESS` and refuses writes without them. SIGINT/SIGTERM stop the loop; live mode cancels tracked vault orders; process exits without hanging.

## 6. Verify

- [x] 6.1 Run `bun run check` and `bun run format` (then `bun run lint`) on touched files. Grep the example for `exchange.trader`, `createOrder`, `mintSet`, and forbidden vault methods — none in the write path.
- [x] 6.2 Manual Shannon pass: default `bun run bot:dreamdex` is dry-run with no txs; live mode without key errors; wrong-chain RPC refuses writes; tUSDC vault with idle collateral mints + places through the vault (operator EOA pays gas only); after window resolve, auto-redeem credits the vault; SIGINT exits. Confirm `vault.asset()` equals SDK `testUsdc` before live writes.
