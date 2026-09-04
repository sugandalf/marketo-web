# dreamdex-vault-bot

Long-running example operator for Somnia Shannon Testnet. It spends **vault** tUSDC on DreamDEX event contracts using the [ec-oracle-follow](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-oracle-follow) signal to **open** positions and [ec-settlement](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-settlement) logic to **redeem**. The operator EOA pays STT gas only.

Writes stay on the vault adapter (`placeOrder`, `redeem`, `syncMarket`). There is no `exchange.trader` and no mint-a-pair: a bearish view is `BUY_NO`, never `SELL_YES`.

```bash
bun run bot:dreamdex
```

`DRY_RUN=true` by default: discovers live windows and logs intended writes, no transactions.

## Live mode

Set in the repo `.env` (never `PUBLIC_*`):

```
VAULT_ADDRESS=0x...
OPERATOR_PRIVATE_KEY=0x...   # must be the vault's on-chain operator
DRY_RUN=false
EC_UNDERLYING=ETH
EC_INTERVAL=5m
```

Fund the vault with tUSDC and the operator with STT.

## Lifecycle

1. **Redeem** every `.state/` market that is Resolved (winner only) or Voided (both sides), then **claim-sweep** indexer `getClaimable(vault)` for anything that settled while idle.
2. **PnL** every 30s for those ids.
3. **Oracle-follow take** on live ETH 5m (with your filters): sample the SDK price feed, fair-value from opening/strike + vol, cross `BUY_YES` or `BUY_NO` only when the ask is cheaper than fair by `OF_EDGE` (default 3c) and not further than `OF_MAX_DISAGREEMENT`.
4. First ~60s **warms up** spot history (`warming up spot history for ETH`). Heartbeat logs `idle · N tradable · no edge ×…`.
5. Stops taking 40% of the window before expiry (2 min on 5m). SIGINT cancels any tracked IOC leftovers.

Optional knobs match the kit (`OF_EDGE`, `OF_MAX_SHARES`, `OF_COOLDOWN_MS`, `OPERATOR_ID`, `PRICE_FEED_URL`, `PNL_INTERVAL_MS`, `VAULT_SEED_TUSDC`).

The adapter does not wrap `withdraw`, `deposit`, or share mint/redeem.
