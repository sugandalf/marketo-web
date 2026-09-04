## Why

Entered BotVaults can hold backer capital, but nothing yet spends that capital on DreamDEX event markets. We need a long-running example bot that signs as the vault **operator**, spends **vault** idle collateral (not the operator EOA), places bets, and auto-redeems so we can test the vault’s trading surface end to end.

## What Changes

- Add `examples/dreamdex-vault-bot/`: a Bun CLI that loops like [ec-starter](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-starter) and [the hackathon lifecycle/redeem scripts](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template/tree/main/typescript/src), but every write goes through the provided vault adapter (`placeOrder`, `mintCompleteSet`, `redeem`, `syncMarket`, …) with the vault as trader.
- Add `bun run bot:dreamdex` (long-running). Default `DRY_RUN=true`. Live mode needs `OPERATOR_PRIVATE_KEY` (must be the vault’s on-chain operator) plus STT for gas.
- Share the operator vault ABI (the methods the user supplied). Do **not** expose `withdraw` / `redeemShares` / `requestRedeem` / `deposit` / `mint` on the adapter.
- Gate trades: on-chain market status Trading; vault `asset()` equals that market’s tUSDC collateral; size from vault idle balance and lot grid.
- Each cycle: sync if needed, mint a complete set once per window when idle collateral allows, take a small IOC (or rest a quote), then auto-redeem resolved/voided positions held by the **vault**.

This is **CLI + ABI wiring**, not product UI. The vault contract already exposes these operator methods; we are not changing the factory or ERC-4626 deposit/withdraw.

**Collateral (hackathon):** The team confirmed vaults and DreamDEX event markets both use **tUSDC** (6 decimals). Spot USDso is unused. The bot still refuses a market when `vault.asset()` ≠ that market’s collateral (safety gate). Canonical tUSDC is `SOMNIA_TESTNET_ADDRESSES.testUsdc` from the markets SDK, checked against `vault.asset()` at runtime. This change does not swap tokens.

## Non-goals

- Homepage / program / portfolio deposit or withdraw UI (already specified elsewhere).
- Using `@dreamdex-bot-kit/ec-core` or `exchange.trader.*` for writes (those pull the EOA wallet).
- Operator calling IERC4626 withdraw/deposit or pulling depositor funds.
- Product UI for live positions, PnL, or SQLite trade history.
- Mainnet, multi-vault orchestration, or a production MM strategy.

## Capabilities

### New Capabilities

- `bot-operator`: Long-running example operator that trades DreamDEX event contracts **through** an entered BotVault: vault-as-trader reads, operator-key writes of the allowed methods only, complete-set mint, bet, auto-redeem, dry-run vs live, collateral and idle-balance gates.

### Modified Capabilities

- (none)

## Impact

- **Wallet / chain:** Somnia Shannon Testnet only. Operator key lives in the CLI env, never in the SvelteKit client bundle or `$lib/server` user-flow. Wrong operator, empty vault, collateral mismatch, reverted tx, and RPC failure are log states (no UI).
- **Funds:** Collateral and ERC-6909 outcomes are the vault’s. Operator EOA pays gas only. Adapter forbids share/capital extraction.
- **Code:** `examples/dreamdex-vault-bot/`, root `package.json` script, operator ABI module, `.env.example` keys. Optional `@somnia-chain/markets-sdk` for **reads** (discover, status, books, outcome balances with `account = vault`).
- **Assumptions:** Deployed vaults implement the supplied operator ABI; `DRY_RUN` default true; one vault per process via `VAULT_ADDRESS`; vault `asset` and event-market collateral are tUSDC.
