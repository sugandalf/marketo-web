## Context

See proposal.md (Why) and `specs/bot-operator/spec.md` for behavior. Entered vaults already exist (`createVault` + SQLite `bot` rows). `src/lib/chain/botVault.ts` only has ERC-4626 deposit/withdraw. Nothing spends vault capital on DreamDEX. The official [ec-starter](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-starter) and [hackathon template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template/tree/main/typescript/src) sign as the EOA via `exchange.trader.*` / `@dreamdex-bot-kit/ec-core`. Our writes must hit the vault adapter the user supplied, with the vault as trader.

Product chain remains Somnia Shannon Testnet (`50312`). The SvelteKit app still never holds a user key. This process is a separate Bun CLI.

## Goals / Non-Goals

**Goals:**

- Isolate a long-running example under `examples/dreamdex-vault-bot/` that the Kit app does not import.
- One write path: operator-key `walletClient.writeContract` on the vault using only `placeOrder`, `cancelOrder`, `reduceOrder`, `mintCompleteSet`, `mergeCompleteSet`, `redeem`, `syncMarket`.
- One read path: public RPC; idle ERC-20 and ERC-6909 balances for **vault**, never the operator EOA.
- Default dry-run; live mode waits for receipts.

**Non-Goals:**

- Wiring trades into `/`, `/program`, `/portfolio`, or SQLite projections.
- Adding a USDso↔tUSDC swap, or using DreamDEX spot USDso as event collateral.
- Consuming `@dreamdex-bot-kit/ec-core` (workspace package; wallet-as-trader).

## Decisions

### 1. Separate CLI, not a Kit route

Folder: `examples/dreamdex-vault-bot/` (`src/index.ts`, `src/adapter.ts`, `src/discover.ts`, `src/cycle.ts`, README). Root script: `"bot:dreamdex": "bun run examples/dreamdex-vault-bot/src/index.ts"`. Env from repo `.env` via Bun (no dotenv if Bun loads it; otherwise `Bun.env`).

The example MUST NOT import `$lib/server` or wagmi browser connectors. Operator key is `OPERATOR_PRIVATE_KEY` (never `PUBLIC_*`). Do not add the key to SvelteKit `$env/static/private` for this change — that would tempt server routes to sign.

**Alternative:** Background worker inside `hooks.server.ts`. Rejected — the web server would hold a trading key.

### 2. Vault adapter is the only writer

Port the user-supplied `createVaultAdapter` into `examples/dreamdex-vault-bot/src/adapter.ts`. `trader = vault`. `write` uses `vaultAbi` + operator account. Export `forbiddenMethods` and never wrap them.

Put the operator ABI next to the adapter (not in `botVault.ts`) so deposit/withdraw UI cannot accidentally call `placeOrder`. If a later change needs the ABI in the app, copy it then.

**Alternative:** `exchange.createOrder` then hope the SDK can set `msg.sender` to the vault. Rejected — the SDK signs the EOA; the venue would debit the wallet.

**Alternative:** Depend on `@dreamdex-bot-kit/ec-core`. Rejected — it mints/places from the signer wallet and is not published as a standalone package we can `bun add` cleanly.

### 3. SDK (or logs) for reads only

Add `@somnia-chain/markets-sdk` with `bun add` for Shannon addresses, `getMarketOnchain`, order books, and `listBinaryMarkets`. Construct `SomniaMarkets` **without** using `trader` / `createOrder` / `mintSet`. Pass `account: vault` (or adapter `outcomeBalance`) everywhere inventory is read.

If the SDK requires a `privateKey` at construct time, pass the operator key only so the WS client starts; still never call `exchange.trader.*`. Fallback: `getLogs` `MarketCreated` like `discover.mjs` (1000-block windows on Shannon).

WebSocket: `WS_RPC_URL` default `wss://api.infra.testnet.somnia.network/ws`. Indexer default `https://dev.smk.somnia.host/v1/graphql` (reads; not source of truth for status).

### 4. Cycle: redeem → discover → gate → mint once → IOC

Same shape as ec-starter, vault-aware:

1. `eth_chainId` must be `50312`.
2. Precheck: `getAddress(account)` equals on-chain vault operator if a view exists; otherwise `simulateContract` the first write. Mismatch → log and skip writes.
3. `syncMarket` before mint/place when the vault needs venue sync.
4. Auto-redeem from a local set of `marketId`s the process minted/traded (append-only JSON under `examples/dreamdex-vault-bot/.state/`), plus any finalized rows the indexer still returns. `loadMarkets()` skips finalized — do not rely on it for claims. Holder = vault.
5. Discover live windows; skip unless `vault.asset() === market.collateral` (checksum compare).
6. Skip unless on-chain status Trading and `expiry - now` exceeds a min-left (scale with `intervalSec`).
7. If symbol not in `seeded`: `mintCompleteSet` sized `min(idleCollateral, TAKE_MAX_SHARES lots)` via `snap`. Then `placeOrder` IOC (`orderType = 2`) crossing a touch; sells capped by vault outcome balance.
8. Wait for receipt; log hash / revert / RPC. Sleep `TAKE_INTERVAL_MS` (default 8000). SIGINT/SIGTERM: cancel tracked `orderId`s via vault `cancelOrder`.

Sides: `0|1|2|3` = BUY_YES, SELL_YES, BUY_NO, SELL_NO. Price/qty `bigint` in tUSDC native units (6 decimals). Tick/lot read from the pool at runtime, not hardcoded.

Env: `VAULT_ADDRESS`, `OPERATOR_PRIVATE_KEY`, `DRY_RUN` (default true), `TAKE_INTERVAL_MS`, `TAKE_MAX_SHARES`, `EC_UNDERLYING` (optional BTC/ETH filter), RPC/WS/indexer.

### 5. Hackathon collateral is tUSDC

The team confirmed vault `asset` and DreamDEX event-market collateral are the same token: faucet **tUSDC** (6 decimals). Resolve the address from `SOMNIA_TESTNET_ADDRESSES.testUsdc` and from `vault.asset()` at runtime; do not use DreamDEX spot USDso (`0x9c32F382…`). Size and snap in 6-decimal units.

Keep the equality gate so a misconfigured vault still skips instead of reverting. README should say: fund the vault with tUSDC, operator with STT.

**Alternative:** Treat Marketo’s “USDso” env comment as the venue token. Rejected — hackathon venue is tUSDC.
**Alternative:** Swap USDso → tUSDC inside the bot. Rejected — unnecessary if vaults are created with tUSDC.

## Risks / Trade-offs

- **[Risk] `PUBLIC_VAULT_ASSET_ADDRESS` comment still says USDso.** Env may already be tUSDC; apply must compare `vault.asset()` to SDK `testUsdc`, not the comment. → Equality gate + README.
- **[Risk] Deployed vault missing operator methods.** Adapter ABI is assumed. → `simulateContract` on startup; fail closed with a clear log.
- **[Risk] SDK `trader` used by mistake.** → Lint/review: no `exchange.trader`, `createOrder`, `mintSet` in the example. Adapter `forbiddenMethods` documented.
- **[Risk] Operator key leak.** → CLI-only env; never log the key; not in `PUBLIC_*`; `.state/` gitignored.
- **[Risk] Silent unredeemed inventory.** → Persist traded `marketId`s; redeem from that list every cycle.
- **[Trade-off] Example is not a production MM.** Caps and random buy/sell exist only to exercise the vault.

## Migration Plan

- Additive: new folder, root script, optional `bun add @somnia-chain/markets-sdk`, `.env.example` keys. No Drizzle migration. No UI.
- Rollback: remove the example and script; unused SDK dep can be dropped.
- Live test: dry-run first; then a tUSDC vault with idle balance > one lot, operator key funded with STT.

## Open Questions

- Whether BotVault exposes a public `operator()` view for the precheck (simulate is enough if not).
- Whether `syncMarket` is required every cycle or only once per `marketId` (call before first write per market; skip if it reverts as no-op).
