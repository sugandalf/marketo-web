# bot-operator Specification

## Purpose

Lets the vault’s authorized operator run a long-lived example bot that spends vault idle collateral on DreamDEX event markets (mint a complete set, place a bet, auto-redeem), never the operator EOA’s tokens, and never depositor withdraw.

## Requirements

### Requirement: Operator key is the only signer for vault trades

The example bot MUST submit vault trading writes only from the configured operator private key. The SvelteKit app MUST NOT hold that key or submit trades, deposits, or withdrawals on anyone’s behalf. A spectator (no operator key, or dry-run without a key) MUST NOT send a chain write.

#### Scenario: Missing operator key in live mode

- **GIVEN** `DRY_RUN` is false and no operator private key is configured
- **WHEN** the bot starts
- **THEN** it does not send a transaction and exits or stays idle with an error that a key is required

#### Scenario: Dry-run without a key

- **GIVEN** `DRY_RUN` is true (the default) and no operator private key is configured
- **WHEN** the bot runs a cycle
- **THEN** it MAY discover markets and log intended mint/order/redeem actions and MUST NOT send a transaction

#### Scenario: Web app does not trade

- **GIVEN** a visitor is on `/`, `/program`, `/portfolio`, or `/enter`
- **WHEN** they use the product
- **THEN** the example bot’s operator key is not loaded in the client bundle and those pages do not call vault `placeOrder`, `mintCompleteSet`, or `redeem`

### Requirement: Wrong network blocks live writes

Live writes MUST target only the configured Somnia Shannon Testnet. If the RPC chain id differs, the bot MUST NOT send mint, order, or redeem transactions.

#### Scenario: RPC is not the product chain

- **GIVEN** live mode with a valid operator key
- **WHEN** the configured RPC reports a chain id other than the product chain
- **THEN** no vault write is sent and the bot logs a wrong-network error

#### Scenario: Product chain then trade

- **GIVEN** the bot was blocked for wrong network
- **WHEN** the RPC is the product chain and a cycle runs against a tradable matching market
- **THEN** the bot MAY send allowed vault writes

### Requirement: Vault is the trader, operator is not a depositor

Reads of idle collateral and ERC-6909 outcome balances MUST use the vault address as the account, never the operator EOA. Spending MUST pull the vault’s asset balance. The operator MUST NOT be treated as a depositor. A depositor MUST NOT gain operator rights because they backed the horse. The operator MUST NOT call vault share or capital methods (`withdraw`, `redeemShares`, `requestRedeem`, `deposit`, `mint`).

#### Scenario: Collateral and outcomes belong to the vault

- **GIVEN** a live vault with idle asset balance and a tradable matching market
- **WHEN** the bot mints a complete set and places an order
- **THEN** those writes are vault functions signed by the operator, and subsequent balance reads are for the vault address

#### Scenario: Operator EOA is not the inventory account

- **GIVEN** the operator EOA holds none of the vault asset and the vault holds a positive idle balance
- **WHEN** the bot sizes a mint or buy
- **THEN** size is taken from the vault idle balance, not from the operator EOA token balance

#### Scenario: Forbidden capital methods are not called

- **GIVEN** the bot is running in live or dry-run mode
- **WHEN** a cycle runs
- **THEN** the bot does not call `withdraw`, `redeemShares`, `requestRedeem`, `deposit`, or ERC-4626 `mint` on the vault

### Requirement: Collateral must match the market

The bot MUST send `mintCompleteSet`, `placeOrder`, `mergeCompleteSet`, or `redeem` only when the vault’s `asset()` equals that market’s event-contract collateral. For this hackathon that token is tUSDC (6 decimals). On mismatch it MUST skip the market, log the mismatch, and MUST NOT send those writes.

#### Scenario: Vault asset is not market collateral

- **GIVEN** a live vault whose `asset()` is not tUSDC (or otherwise differs from the window’s collateral)
- **WHEN** a cycle considers that window
- **THEN** no mint, order, or redeem is sent for that market and the log states the collateral mismatch

#### Scenario: Matching tUSDC collateral may trade

- **GIVEN** `vault.asset()` equals the market’s tUSDC collateral, the market is Trading, and the vault has idle collateral
- **WHEN** a cycle runs in live mode with a valid operator
- **THEN** the bot MAY mint and place against that market through the vault

### Requirement: Gate on on-chain market status

The bot MUST treat on-chain market status as authoritative. It MUST place or mint only while the market is Trading, MUST skip windows too close to expiry, and MUST NOT place on locked, settling, resolved, or voided markets.

#### Scenario: Trading window is eligible

- **GIVEN** on-chain status is Trading and enough time remains before expiry
- **WHEN** collateral and idle-balance gates pass
- **THEN** the bot MAY mint and place on that market

#### Scenario: Non-trading window is skipped

- **GIVEN** on-chain status is not Trading (including locked, settling, resolved, voided)
- **WHEN** a cycle considers that market
- **THEN** the bot does not mint or place on it

### Requirement: Seed inventory then cross a quote

For an eligible market the bot MUST, at most once per window symbol, mint a complete set from vault idle collateral (snapped to the venue lot grid and capped by configured max size and idle balance). It MUST then place a small order through the vault (IOC take or a resting quote) using vault outcome inventory for sells. Amounts MUST be `bigint` native units.

#### Scenario: First pass mints then takes

- **GIVEN** an eligible matching market, vault idle collateral above one lot, and the window not yet seeded
- **WHEN** a live cycle runs
- **THEN** the bot calls vault `mintCompleteSet` (or logs that mint in dry-run) and then vault `placeOrder`, and waits for each receipt before treating the write as done

#### Scenario: Empty vault does not mint

- **GIVEN** vault idle collateral is zero or below one lot
- **WHEN** a cycle runs
- **THEN** the bot does not mint or place and logs insufficient vault collateral

#### Scenario: Hash is not success

- **GIVEN** a vault write was submitted
- **WHEN** the transaction is still pending
- **THEN** the bot does not treat the mint, order, or redeem as confirmed until the receipt succeeds

### Requirement: Auto-redeem vault winnings

Each cycle the bot MUST look up markets that have resolved or voided in which the **vault** still holds outcome tokens, and MUST redeem those amounts through vault `redeem`. On a resolved market it MUST redeem the winning side only. On a voided market it MUST redeem both sides. Losing-side redeem MUST NOT be required. Redeem MUST use the vault as holder.

#### Scenario: Resolved market with vault Up tokens

- **GIVEN** a market is resolved Up and the vault holds a positive Up balance
- **WHEN** a live cycle runs
- **THEN** the bot submits vault `redeem` for that market, outcome index 0, and the vault’s Up amount, and does not redeem Down

#### Scenario: Voided market refunds both sides

- **GIVEN** a market is voided and the vault holds Up and/or Down
- **WHEN** a live cycle runs
- **THEN** the bot redeems each positive vault outcome balance for that market

#### Scenario: Nothing to claim

- **GIVEN** a resolved market and the vault holds none of the winning outcome
- **WHEN** a cycle runs
- **THEN** the bot does not send `redeem` for that market

### Requirement: Failed writes stay recoverable

If a vault write is rejected by the RPC, reverts (including unauthorized operator, insufficient vault collateral, or venue errors), or the operator key does not match the vault’s on-chain operator, the bot MUST log a distinct failure, MUST NOT treat the action as filled, and MUST continue later cycles.

#### Scenario: Key is not the vault operator

- **GIVEN** live mode with a key whose address is not the vault’s operator
- **WHEN** the bot sends a vault write
- **THEN** the write fails or is not sent after a precheck, and the bot logs an unauthorized-operator error without calling depositor withdraw

#### Scenario: Transaction reverts

- **GIVEN** a vault `placeOrder` or `mintCompleteSet` is submitted
- **WHEN** the receipt status is reverted
- **THEN** the bot logs the revert, does not count a fill, and continues the loop

#### Scenario: RPC failure

- **GIVEN** a cycle is in progress
- **WHEN** an RPC read or write fails before a receipt
- **THEN** the bot logs the RPC failure, sends no further write for that attempt, and retries on a later cycle

### Requirement: Long-running command with dry-run default

The repository MUST provide a Bun command that starts this bot as a long-running process (SIGINT/SIGTERM stop). `DRY_RUN` MUST default to true. Live mode MUST require an explicit dry-run off plus operator key, vault address, and RPC.

#### Scenario: Default start is dry-run

- **GIVEN** the operator starts the documented Bun command with no dry-run override
- **WHEN** the process runs
- **THEN** it loops on an interval, logs intended actions, and sends no transactions

#### Scenario: Stop on signal

- **GIVEN** the bot is running
- **WHEN** it receives SIGINT or SIGTERM
- **THEN** it stops the loop, MAY cancel tracked vault orders in live mode, and exits without hanging
