## Purpose

Lets a connected wallet back an entered bot by depositing the vault asset into that bot’s on-chain vault, with the same stamp on the homepage, program, and portfolio, and a SQLite projection of confirmed deposits.

## ADDED Requirements

### Requirement: Spectator cannot deposit

A disconnected visitor is a spectator. The system MUST NOT submit `deposit`, MUST NOT submit token `approve`, and MUST NOT persist a deposit row until a wallet is connected. The system MUST prompt the spectator to connect and MUST state that no transaction is sent until they approve it. This MUST hold on `/`, `/program`, and `/portfolio`.

#### Scenario: Disconnected visitor stamps Deposit on the homepage

- **GIVEN** the visitor is on `/` with a live entered horse selected, a positive amount, and no connected wallet
- **WHEN** they stamp Deposit
- **THEN** the system does not send a chain transaction, does not write a deposit row, and shows a connect prompt

#### Scenario: Disconnected visitor stamps Deposit on the program

- **GIVEN** the visitor is on `/program` with a live entered horse overlay, a positive amount, and no connected wallet
- **WHEN** they stamp Deposit
- **THEN** the system does not send a chain transaction, does not write a deposit row, and shows a connect prompt

#### Scenario: Disconnected visitor stamps Deposit on the book

- **GIVEN** the visitor is on `/portfolio` with a live backed horse overlay in deposit mode, a positive amount, and no connected wallet
- **WHEN** they stamp Deposit
- **THEN** the system does not send a chain transaction, does not write a deposit row, and shows a connect prompt

#### Scenario: Connect after a blocked stamp

- **GIVEN** a spectator was blocked for being disconnected on any of those three pages
- **WHEN** they connect a wallet on the configured chain with the same live horse and positive amount
- **THEN** they MAY stamp again and the system proceeds with the connected-backer flow

### Requirement: Only a live entered vault can be deposited

The system MUST send `deposit` only against a confirmed entered bot vault (a vault address known from the bot projection). A synthetic demo horse MUST NOT be treated as a live vault. The system MUST NOT send `approve` or `deposit` and MUST NOT persist a deposit row for a horse without that vault.

#### Scenario: Synthetic horse is not depositable

- **GIVEN** the selected horse is a synthetic demo horse with no entered vault
- **WHEN** the visitor stamps Deposit with a positive amount
- **THEN** no transaction is sent, no deposit row is written, and the slip shows that the horse is not a live vault

#### Scenario: Live entered horse is depositable

- **GIVEN** the selected horse is a confirmed entered bot with a vault address
- **WHEN** a connected backer on the configured chain stamps Deposit with a valid positive amount
- **THEN** the system proceeds with allowance and/or `deposit` against that vault

### Requirement: Connected backer signs deposit

A connected wallet on the configured chain is the backer. The system MUST send `deposit` only as a user-signed transaction from that wallet. The server MUST NOT hold a key or submit `deposit` or token `approve` on the user’s behalf.

`deposit` MUST use:

- vault = the selected entered bot’s vault address
- `assets` = the stamped amount in native token units (`bigint`), greater than zero
- `receiver` = the connected address

The three pages MUST share this same deposit behavior; only the surrounding slip layout MAY differ.

#### Scenario: Homepage deposit

- **GIVEN** a connected backer on the configured chain on `/` with a live horse and a valid positive amount
- **WHEN** they stamp Deposit and confirm in the wallet
- **THEN** `deposit` is submitted to that horse’s vault with `receiver` equal to the connected address

#### Scenario: Program deposit

- **GIVEN** a connected backer on the configured chain on `/program` with a live horse overlay and a valid positive amount
- **WHEN** they stamp Deposit and confirm in the wallet
- **THEN** `deposit` is submitted to that horse’s vault with `receiver` equal to the connected address

#### Scenario: Portfolio deposit

- **GIVEN** a connected backer on the configured chain on `/portfolio` with a live horse overlay in deposit mode and a valid positive amount
- **WHEN** they stamp Deposit and confirm in the wallet
- **THEN** `deposit` is submitted to that horse’s vault with `receiver` equal to the connected address

#### Scenario: Zero amount does not send

- **GIVEN** a connected backer has a live horse selected
- **WHEN** they stamp Deposit with amount zero or empty
- **THEN** no transaction is sent and no deposit row is written

### Requirement: Wrong network blocks the write

The product chain for this flow is Somnia Shannon Testnet. If the connected wallet is on another chain, the system MUST NOT send `approve` or `deposit`. It MUST show a wrong-network state and offer a switch to the configured chain.

#### Scenario: Connected on the wrong chain

- **GIVEN** a wallet is connected on a chain other than the configured Somnia testnet
- **WHEN** the backer stamps Deposit with a valid amount on a live horse
- **THEN** no transaction is sent and the slip shows a wrong-network prompt

#### Scenario: Switch then deposit

- **GIVEN** the backer was blocked for wrong network
- **WHEN** the wallet is on the configured chain and they stamp again
- **THEN** the system proceeds with allowance and/or `deposit` as required

### Requirement: Roles stay distinct

Depositing MUST NOT grant trader or operator rights. The connected signer is the backer (`receiver` of shares). The vault owner remains the creator. The bot wallet remains the authorized trader (`operator`) and MUST NOT be treated as a depositor merely because a deposit occurred. A spectator remains a spectator until they connect and confirm a deposit.

An owner MAY deposit as a backer; that deposit MUST mint shares to the connected owner without collapsing owner into operator. An operator who is not the connected signer MUST NOT be able to deposit through this flow.

#### Scenario: Backer is not the operator

- **GIVEN** a connected wallet that is neither the vault owner nor the operator deposits successfully
- **WHEN** the receipt confirms
- **THEN** the book marks that wallet as a backer of the horse and does not present them as the operator or as able to allocate vault funds

#### Scenario: Owner depositing does not pull depositor rights for others

- **GIVEN** the vault creator is connected and deposits into their own live vault
- **WHEN** the receipt confirms
- **THEN** the creator is recorded as a backer for that deposit and still cannot redeem other depositors’ funds through this flow

#### Scenario: Spectator still cannot deposit someone else’s vault

- **GIVEN** a live vault exists
- **WHEN** a disconnected visitor views `/`, `/program`, or `/portfolio`
- **THEN** they remain a spectator and cannot submit `deposit`

### Requirement: Deposit requires asset allowance to the vault

The system MUST require a sufficient ERC-20 allowance of the configured asset **to the selected vault** (not the factory) before `deposit`. If allowance is insufficient, the backer MUST first sign `approve`. The system MUST NOT require `approve` when allowance already covers `assets`.

#### Scenario: Positive amount, no allowance

- **GIVEN** a connected backer with a valid positive amount and allowance to the vault below `assets`
- **WHEN** they stamp Deposit
- **THEN** the wallet is asked to approve the vault for at least `assets` before `deposit`

#### Scenario: Backer rejects approve

- **GIVEN** an `approve` prompt is showing
- **WHEN** the backer rejects it
- **THEN** no `deposit` is sent, no deposit row is written, and the slip shows a rejected-approval message

### Requirement: Deposit cap blocks the write

The system MUST NOT send `deposit` when `assets` exceed the vault’s remaining deposit cap for that receiver. It MUST show a cap-exceeded state and MUST NOT persist a row.

#### Scenario: Amount above remaining cap

- **GIVEN** a connected backer on the configured chain whose stamped amount is greater than the vault’s remaining `maxDeposit` for their address
- **WHEN** they stamp Deposit
- **THEN** no transaction is sent, no deposit row is written, and the slip shows a cap-exceeded message

### Requirement: Backed means a confirmed deposit

The system MUST wait for a successful receipt. A sent hash is not a deposit. On success the system MUST read `assets` and `shares` from the receipt (`Deposit` event). Only then MAY it show a confirmed state (without presenting that deposit as SYNTHETIC), persist the projection, and treat the connected wallet as a backer of that horse.

While the transaction is pending, the system MUST show a pending state and MUST NOT present the deposit as confirmed.

#### Scenario: Confirmed deposit

- **GIVEN** the backer signed `deposit` (and `approve` if required)
- **WHEN** the receipt confirms and assets and shares are known
- **THEN** the slip shows confirmed, the projection is stored, and `/portfolio` lists the horse as BACKED for that wallet

#### Scenario: Hash sent but not confirmed

- **GIVEN** `deposit` was submitted
- **WHEN** the transaction is still pending
- **THEN** the UI shows pending and does not show a confirmed deposit or write a confirmed deposit row

### Requirement: Rejected and reverted deposits stay on the slip

If the user rejects `deposit`, the RPC fails, or the transaction reverts (including `InvalidAmount`, `DepositCapExceeded`, insufficient asset balance, or failed allowance pull), the system MUST keep the slip usable, MUST NOT persist a confirmed deposit, and MUST show a distinct error for reject vs revert vs RPC failure.

#### Scenario: User rejects deposit

- **GIVEN** the wallet is prompting to sign `deposit`
- **WHEN** the backer rejects the signature
- **THEN** no deposit row is written and the slip shows a rejected-transaction message

#### Scenario: deposit reverts

- **GIVEN** `deposit` is submitted
- **WHEN** the transaction reverts
- **THEN** the slip stays usable, no confirmed deposit row is written, and a reverted message is shown

#### Scenario: RPC failure

- **GIVEN** the backer stamps Deposit
- **WHEN** the RPC request fails before a receipt
- **THEN** the slip stays usable and an RPC-failure message is shown

### Requirement: Confirmed deposit is projected

After confirmation the system MUST store a SQLite projection keyed by the deposit transaction hash, including at least: chain id, vault, depositor (`receiver`), sender, asset, assets in native units, shares in native units, and tx hash. The system MUST validate addresses and amounts on the server before insert. Duplicate transaction hashes MUST NOT create a second row. The horse MUST already exist as an entered bot vault; unknown vaults MUST be rejected.

#### Scenario: Deposit persisted

- **GIVEN** a confirmed `deposit` into an entered vault
- **WHEN** the projection is written
- **THEN** a single row exists for that transaction hash with the vault, depositor, assets, and shares

#### Scenario: Unconfirmed stamp is not stored

- **GIVEN** the backer filled an amount but `deposit` has not confirmed
- **WHEN** the page is used
- **THEN** the system does not insert a confirmed deposit row for that stamp

#### Scenario: Unknown vault is not stored

- **GIVEN** a client posts a deposit whose vault is not an entered bot
- **WHEN** the server handles persist
- **THEN** no deposit row is written

### Requirement: Chain wins on conflict

If the stored projection disagrees with chain state for the same deposit (vault, depositor, assets, shares, or tx), the system MUST treat chain as source of truth and MUST NOT present the stale projection as settled fact.

#### Scenario: Projection disagrees with chain

- **GIVEN** a deposit row exists for a transaction hash
- **WHEN** chain state for that receipt differs from the row
- **THEN** the UI does not present the conflicting projected fields as confirmed chain fact

### Requirement: Book lists live backer positions from deposits

`/portfolio` MUST list a connected wallet’s live BACKED horses from confirmed deposits into entered vaults, not from a local-only book mutation. Owner-only (MINE, not backed) rows MUST remain watch-only for depositor funds. After a confirmed deposit from `/` or `/program`, the same wallet MUST see that horse as BACKED on `/portfolio` without requiring a second stamp.

#### Scenario: Homepage deposit appears on the book

- **GIVEN** a connected backer confirmed a deposit on `/`
- **WHEN** they open `/portfolio` with the same wallet
- **THEN** that horse is listed as BACKED for that wallet

#### Scenario: Local book mutation is not the live deposit

- **GIVEN** a live entered vault
- **WHEN** a connected backer confirms an on-chain deposit
- **THEN** the BACKED position is stored as a verified projection and is not solely a sessionStorage increment
