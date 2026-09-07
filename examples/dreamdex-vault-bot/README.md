# dreamdex-vault-bot

Long-running example operator for Somnia Shannon Testnet. It spends **vault** tUSDC on DreamDEX event contracts using the [ec-oracle-follow](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-oracle-follow) signal to **open** positions and [ec-settlement](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-settlement) logic to **redeem**. The operator EOA pays STT gas only.

Writes stay on the vault adapter (`placeOrder`, `redeem`, `syncMarket`). There is no `exchange.trader` and no mint-a-pair: a bearish view is `BUY_NO`, never `SELL_YES`.

```bash
bun run bot:dreamdex
```

Compile a standalone binary (no Bun on the host) with `bun run compile:bot:dreamdex` → `dist/bot-dreamdex`. Compiled runs persist `markets.json` under `BOT_STATE_DIR` or `./.state` in the working directory.

`DRY_RUN=true` by default: discovers live windows and logs intended writes, no transactions.

Homepage and `/program` do **not** read this bot’s logs. Live-horse TVL, PnL, and past performances come from SQLite rows written by a separate read-only indexer:

```bash
bun run bot:performance
```

Or `bun run compile:bot:performance` → `dist/bot-performance`. Run that process beside the web app (`DATABASE_URL`, RPC, optional `INDEXER_URL` / `WS_RPC_URL`, `STATS_INTERVAL_MS` default 30000). It does not load `OPERATOR_PRIVATE_KEY` and does not send vault writes. Until it has stored a snapshot, live horses show empty fights and zero purse.

## Live mode

Set in the repo `.env` (never `PUBLIC_*`):

```
VAULT_ADDRESS=0x...
OPERATOR_PRIVATE_KEY=0x...   # must be the vault's on-chain operator
DRY_RUN=false
EC_UNDERLYING=ETH
EC_INTERVAL=15m,1h
```

Fund the vault with tUSDC and the operator with STT.

## Lifecycle

1. **Redeem** every `.state/` market that is Resolved (winner only) or Voided (both sides), then **claim-sweep** indexer `getClaimable(vault)` for anything that settled while idle.
2. **PnL** every 30s for those ids.
3. **Oracle-follow take** on live ETH 15m and 1h (with your filters; `EC_INTERVAL` accepts a comma list). Sample the SDK price feed, fair-value from opening/strike + vol. Buys `YES` only when the model `pUp > 0.5` (and `NO` only when `pUp < 0.5`) — it will not buy YES just because the model is less bearish than the book. Cross the ask only when it is at least `OF_MIN_ASK` (default 10c), cheaper than fair by `OF_EDGE` (default 8c), and not further than `OF_MAX_DISAGREEMENT` (default 5c). Each cycle drops resolved/filtered markets from the in-memory exposure cap.
4. First ~60s **warms up** spot history (`warming up spot history for ETH`). Heartbeat logs `idle · N tradable · no edge ×…`.
5. Stops taking 40% of the window before expiry (6 min on 15m; 24 min on 1h). SIGINT cancels any tracked IOC leftovers.

Optional knobs: `OF_EDGE`, `OF_MIN_ASK`, `OF_MAX_DISAGREEMENT`, `OF_MAX_SHARES`, `OF_MAX_EXPOSURE`, `OF_MAX_HORIZONS`, `OF_NEAR_EXPIRY_STOP_MS`, `OF_EXPECTED_MOVE`, `OF_MIN_VOL`, `OF_COOLDOWN_MS`, `OPERATOR_ID`, `PRICE_FEED_URL`, `PNL_INTERVAL_MS`, `VAULT_SEED_TUSDC`.

The adapter does not wrap `withdraw`, `deposit`, or share mint/redeem.
