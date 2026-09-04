# bot-performance Specification

## Purpose

Lets a long-running read-only indexer periodically project entered-bot vault TVL, PnL, and past fights into SQLite so `/` and `/program` can list live bot performance by querying that store, not by aggregating on the request.

## Requirements

### Requirement: Long-running command aggregates on an interval

The repository MUST provide a documented Bun command that runs as a long-running process. Each cycle MUST load entered bot vaults from SQLite, read chain state for those vaults, and persist performance, PnL, and TVL projections. The interval MUST come from configuration and MUST default to 30 seconds. SIGINT or SIGTERM MUST stop the loop and exit without hanging. The command MUST NOT require an operator private key.

#### Scenario: Default start loops

- **GIVEN** at least one entered bot row exists and RPC is the product chain
- **WHEN** an operator starts the documented command
- **THEN** the process loops on the configured interval, reads chain for those vaults, and writes SQLite projections

#### Scenario: Stop on signal

- **GIVEN** the aggregator is running
- **WHEN** it receives SIGINT or SIGTERM
- **THEN** it stops the loop and exits without hanging

#### Scenario: Empty roster still loops

- **GIVEN** there are no entered bot rows
- **WHEN** a cycle runs
- **THEN** the process writes no performance rows for missing vaults and continues the next interval

### Requirement: Command is read-only

The aggregator MUST NOT hold or load an operator key, MUST NOT submit transactions, and MUST NOT call vault capital or trading writes (`deposit`, `withdraw`, `redeemShares`, `requestRedeem`, `mint`, `placeOrder`, `mintCompleteSet`, `redeem`). Spectators, depositors, and operators MUST all see the same projected figures; role MUST NOT change how performance is stored or displayed.

#### Scenario: No vault writes

- **GIVEN** the aggregator is running with entered vaults
- **WHEN** a cycle runs
- **THEN** it sends no chain transaction and does not call vault capital or trading write methods

#### Scenario: Same figures for every role

- **GIVEN** a live horse has a stored snapshot
- **WHEN** a spectator, a depositor in that vault, and that vault’s operator open `/` or `/program`
- **THEN** each sees the same stored fights, PnL, and purse for that horse

### Requirement: Wrong RPC chain skips the cycle write

Reads MUST target only the configured product chain. If the RPC chain id differs, the cycle MUST NOT upsert performance, PnL, or TVL rows, MUST log a wrong-network error, and MUST continue later cycles.

#### Scenario: RPC is not the product chain

- **GIVEN** the aggregator is running
- **WHEN** the configured RPC reports a chain id other than the product chain
- **THEN** no performance, PnL, or TVL rows are written for that cycle and a wrong-network error is logged

#### Scenario: Product chain then persist

- **GIVEN** a cycle was skipped for wrong network
- **WHEN** the RPC is the product chain and the next cycle succeeds
- **THEN** SQLite projections for entered vaults MAY be written

### Requirement: Persist vault TVL, PnL, and past fights

Each successful cycle MUST store, for each entered vault it could read:

- latest vault TVL as native-unit inventory (idle collateral plus marked outcome value), not seed plus deposits minus withdrawals
- latest vault PnL as native-unit realized plus unrealized (or realized only when mark is unavailable)
- past fights: one row per resolved or voided market the vault traded, with date, window, market (BTC or ETH), side (up or down), and PnL in native units

Amounts MUST be stored as integer native units. The process MUST upsert by vault (and by market id for fights). A failed read for one vault MUST NOT abort the cycle for other vaults, MUST NOT write a partial snapshot for that vault, and MUST leave the previous snapshot in place.

#### Scenario: Snapshot after a successful read

- **GIVEN** an entered vault with idle collateral and at least one marked position
- **WHEN** a cycle completes successfully for that vault
- **THEN** SQLite holds that vault’s TVL and PnL in native units and any resolved or voided trades as fight rows

#### Scenario: Settled market becomes a fight

- **GIVEN** the vault traded a market that is now resolved or voided
- **WHEN** a cycle persists that vault
- **THEN** a fight row exists for that market with date, window, market, side, and PnL, and a later cycle updates the same row instead of duplicating it

#### Scenario: One vault RPC failure

- **GIVEN** two entered vaults and the second vault’s chain read fails
- **WHEN** the cycle runs
- **THEN** the first vault’s snapshot MAY be written, the second vault’s previous snapshot is unchanged, and the loop continues

### Requirement: Web lists query SQLite only

Page loads for `/` and `/program` MUST populate live-horse past performances, PnL, and vault purse from the SQLite projections. Those loads MUST NOT aggregate seed, deposit, or withdrawal rows into purse, MUST NOT sum fights at request time from chain, and MUST NOT call RPC to compute TVL or PnL. Client pages MUST render the loaded fights, PnL, and purse; they MUST NOT fetch chain for those figures.

If a live horse has no snapshot, the pages MUST show empty past performances and zero or absent PnL and purse for that horse, and MUST NOT invent figures or fall back to ledger summation.

#### Scenario: Homepage past performances from store

- **GIVEN** a live entered horse has stored fight rows
- **WHEN** a visitor opens `/` and that horse is on the bench or in the call
- **THEN** the past-performances list shows those stored fights (date, window, market, side, PnL) and does not show the SYNTHETIC stamp on that list

#### Scenario: Program tote from store

- **GIVEN** live entered horses have stored TVL and PnL
- **WHEN** a visitor opens `/program`
- **THEN** the tote PnL and purse columns show the stored values, sort by PnL or purse uses those stored values, and the overlay past-performances list shows stored fights without the SYNTHETIC stamp on those live figures

#### Scenario: Homepage does not aggregate on load

- **GIVEN** a live horse has deposit and withdrawal rows but no performance snapshot
- **WHEN** `/` or `/program` loads
- **THEN** that horse’s purse is not computed from seed plus deposits minus withdrawals, fights are empty, and the load does not call RPC for TVL or PnL

#### Scenario: Synthetic demo horses stay synthetic

- **GIVEN** the labeled synthetic demo roster
- **WHEN** the aggregator runs and a visitor opens `/` or `/program`
- **THEN** those demo horses are unchanged, remain labeled SYNTHETIC, and have no aggregator-written rows
