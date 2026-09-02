# bot-creator Specification

## Purpose

Lets a connected creator file enter-page papers and open an on-chain vault on Somnia testnet so a named bot becomes an entered horse only after the vault transaction confirms, with off-chain papers stored as a SQLite projection.

## Requirements

### Requirement: Spectator cannot open a vault

A disconnected visitor is a spectator. The system MUST NOT submit `createVault` or persist a bot record until a wallet is connected. The papers MUST remain editable. The system MUST prompt the spectator to connect and MUST state that no transaction is sent until they approve it.

#### Scenario: Disconnected visitor stamps Open vault

- **GIVEN** the visitor is on `/enter` with valid papers and no connected wallet
- **WHEN** they submit Open vault
- **THEN** the system does not send a chain transaction, does not write a bot row, and shows a connect prompt

#### Scenario: Connect after a blocked stamp

- **GIVEN** a spectator was blocked for being disconnected
- **WHEN** they connect a wallet on the configured chain with the same valid papers
- **THEN** they MAY stamp again and the system proceeds with the connected-creator flow

### Requirement: Connected creator signs createVault

A connected wallet on the configured chain is the creator (vault owner / fee recipient). The system MUST send `createVault` only as a user-signed transaction from that wallet. The server MUST NOT hold a key or submit `createVault` or token `approve` on the user's behalf.

`createVault` MUST use:

- `operator` = connected address when “same as creator”, else the entered bot-wallet address
- `asset` = the configured vault ERC-20
- `name_` = the trimmed horse name
- `symbol_` = a symbol derived from that name
- `seedAssets` = the opening purse in native token units (`bigint`)
- `performanceFeeBps` = `0`
- `creatorFeeRecipient` = the connected address

#### Scenario: Same-wallet operator

- **GIVEN** a connected creator on the configured chain with valid papers and “same as creator”
- **WHEN** they stamp Open vault and confirm in the wallet
- **THEN** `createVault` is submitted with `operator` and `creatorFeeRecipient` equal to the connected address

#### Scenario: Other-address operator

- **GIVEN** a connected creator on the configured chain who chose “other address” and entered a valid operator address
- **WHEN** they stamp Open vault and confirm in the wallet
- **THEN** `createVault` is submitted with that operator and with `creatorFeeRecipient` equal to the connected address

#### Scenario: Invalid operator address

- **GIVEN** “other address” is selected and the bot-wallet field is empty or not a valid EVM address
- **WHEN** they stamp Open vault
- **THEN** the system does not send a transaction and shows an address error

### Requirement: Wrong network blocks the write

The product chain for this flow is Somnia Shannon Testnet. If the connected wallet is on another chain, the system MUST NOT send `approve` or `createVault`. It MUST show a wrong-network state and offer a switch to the configured chain.

#### Scenario: Connected on the wrong chain

- **GIVEN** a wallet is connected on a chain other than the configured Somnia testnet
- **WHEN** the creator stamps Open vault with valid papers
- **THEN** no transaction is sent and the papers show a wrong-network prompt

#### Scenario: Switch then open

- **GIVEN** the creator was blocked for wrong network
- **WHEN** the wallet is on the configured chain and they stamp again
- **THEN** the system proceeds with allowance and/or `createVault` as required

### Requirement: Roles stay distinct

Opening a vault MUST NOT grant depositor rights to spectators or collapse operator into owner. The connected signer is the creator/owner. The bot wallet is the authorized trader (`operator`) and MUST NOT be treated as a depositor. Seed assets come from the creator’s asset balance; that seed is not a third-party depositor deposit.

#### Scenario: Operator is not a depositor

- **GIVEN** the creator names a different operator address
- **WHEN** the vault confirms
- **THEN** the receipt identifies the connected wallet as the creator and the other address as the bot wallet that will trade, without calling that operator a depositor

#### Scenario: Spectator still cannot trade the vault

- **GIVEN** a vault was created by someone else
- **WHEN** a disconnected visitor views `/enter`
- **THEN** they remain a spectator and cannot submit `createVault`

### Requirement: Seed purse requires asset allowance

When `seedAssets` is greater than zero, the system MUST require a sufficient ERC-20 allowance of the configured asset to the factory before `createVault`. If allowance is insufficient, the creator MUST first sign `approve`. When `seedAssets` is zero, the system MUST NOT require `approve`.

#### Scenario: Purse greater than zero, no allowance

- **GIVEN** a connected creator with a positive opening purse and allowance below `seedAssets`
- **WHEN** they stamp Open vault
- **THEN** the wallet is asked to approve the factory for at least `seedAssets` before `createVault`

#### Scenario: Creator rejects approve

- **GIVEN** an `approve` prompt is showing
- **WHEN** the creator rejects it
- **THEN** no `createVault` is sent, no bot row is written, and the papers stay editable with a rejected-approval message

### Requirement: Entered means a confirmed vault

The system MUST wait for a successful receipt. A sent hash is not entered. On success the system MUST read the new vault address from the receipt (`VaultCreated` or the call return). Only then MAY it show the entered receipt (without presenting the purse as SYNTHETIC), persist the projection, and offer see-on-card.

While the transaction is pending, the system MUST show a pending state and MUST NOT present the vault as opened.

#### Scenario: Confirmed createVault

- **GIVEN** the creator signed `createVault` (and `approve` if required)
- **WHEN** the receipt confirms and a vault address is known
- **THEN** the papers become the entered receipt with that vault, the projection is stored, and see-on-card is available

#### Scenario: Hash sent but not confirmed

- **GIVEN** `createVault` was submitted
- **WHEN** the transaction is still pending
- **THEN** the UI shows pending and does not show an entered receipt or write a confirmed bot row

### Requirement: Rejected and reverted opens stay papers

If the user rejects `createVault`, the RPC fails, or the transaction reverts (including `OperatorExists`, insufficient asset balance, or failed allowance pull), the system MUST keep the papers editable, MUST NOT persist a confirmed bot, and MUST show a distinct error for reject vs revert vs RPC failure.

#### Scenario: User rejects createVault

- **GIVEN** the wallet is prompting to sign `createVault`
- **WHEN** the creator rejects the signature
- **THEN** no bot row is written and the papers show a rejected-transaction message

#### Scenario: createVault reverts

- **GIVEN** `createVault` is submitted
- **WHEN** the transaction reverts (including `OperatorExists`)
- **THEN** the papers stay editable, no confirmed bot row is written, and a reverted message is shown

#### Scenario: RPC failure

- **GIVEN** the creator stamps Open vault
- **WHEN** the RPC request fails before a receipt
- **THEN** the papers stay editable and an RPC-failure message is shown

### Requirement: Confirmed vault is projected with papers

After confirmation the system MUST store a SQLite projection keyed by the vault address, including at least: chain id, factory, vault, creator, operator, asset, name, symbol, seed amount in native units, create tx hash, silks/market, and strategy. Market and strategy are papers metadata and are not required to be on-chain. The system MUST validate addresses and amounts on the server before insert. Duplicate vault addresses MUST NOT create a second row.

#### Scenario: Papers metadata persisted

- **GIVEN** a confirmed `createVault` for a named horse with strategy and BTC or ETH silks
- **WHEN** the projection is written
- **THEN** a single row exists for that vault address with the on-chain ids and the papers’ market and strategy

#### Scenario: Unconfirmed papers are not stored

- **GIVEN** the creator filled papers but `createVault` has not confirmed
- **WHEN** the page is used
- **THEN** the system does not insert a confirmed bot row for those papers

### Requirement: Chain wins on conflict

If the stored projection disagrees with chain state for the same vault (address, owner, operator, asset, seed, or tx), the system MUST treat chain as source of truth and MUST NOT present the stale projection as settled fact.

#### Scenario: Projection disagrees with chain

- **GIVEN** a bot row exists for a vault address
- **WHEN** chain state for that vault differs from the row
- **THEN** the UI does not present the conflicting projected fields as confirmed chain fact
