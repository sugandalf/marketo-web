## ADDED Requirements

### Requirement: Spectator cannot withdraw

A disconnected visitor is a spectator. The system MUST NOT submit `withdraw` and MUST NOT persist a withdrawal row until a wallet is connected. On `/portfolio`, the system MUST prompt the spectator to connect and MUST state that no transaction is sent until they approve it.

#### Scenario: Disconnected visitor stamps Withdraw on the book

- **GIVEN** the visitor is on `/portfolio` with a live backed horse overlay in withdraw mode, a positive amount, and no connected wallet
- **WHEN** they stamp Withdraw
- **THEN** the system does not send a chain transaction, does not write a withdrawal row, and shows a connect prompt

#### Scenario: Connect after a blocked withdraw stamp

- **GIVEN** a spectator was blocked for being disconnected on `/portfolio` in withdraw mode
- **WHEN** they connect a wallet on the configured chain with the same live horse and a positive amount at or below their redeemable assets
- **THEN** they MAY stamp again and the system proceeds with the connected-backer withdraw flow

### Requirement: Only a live entered vault can be withdrawn on chain

The system MUST send `withdraw` only against a confirmed entered bot vault (a vault address known from the bot projection). A synthetic demo horse MUST NOT be treated as a live vault. The system MUST NOT send `withdraw` and MUST NOT persist a withdrawal row for a horse without that vault.

#### Scenario: Synthetic horse is not a chain withdraw

- **GIVEN** the selected horse is a synthetic demo horse with no entered vault
- **WHEN** the visitor stamps Withdraw with a positive amount
- **THEN** no chain transaction is sent and no withdrawal row is written

#### Scenario: Live entered horse is withdrawable

- **GIVEN** the selected horse is a confirmed entered bot with a vault address and the connected wallet has redeemable assets in that vault
- **WHEN** a connected backer on the configured chain stamps Withdraw with a valid positive amount at or below `maxWithdraw` for their address
- **THEN** the system proceeds with `withdraw` against that vault

### Requirement: Connected backer signs withdraw

A connected wallet on the configured chain is the backer. The system MUST send `withdraw` only as a user-signed transaction from that wallet. The server MUST NOT hold a key or submit `withdraw` on the user’s behalf.

`withdraw` MUST use:

- vault = the selected entered bot’s vault address
- `assets` = the stamped amount in native token units (`bigint`), greater than zero
- `receiver` = the connected address
- `owner` = the connected address

The withdraw stamp lives on `/portfolio` only. Homepage and program slips MUST NOT send `withdraw`.

#### Scenario: Portfolio withdraw

- **GIVEN** a connected backer on the configured chain on `/portfolio` with a live horse overlay in withdraw mode and a valid positive amount
- **WHEN** they stamp Withdraw and confirm in the wallet
- **THEN** `withdraw` is submitted to that horse’s vault with `receiver` and `owner` equal to the connected address

#### Scenario: Zero amount does not send

- **GIVEN** a connected backer has a live horse selected in withdraw mode
- **WHEN** they stamp Withdraw with amount zero or empty
- **THEN** no transaction is sent and no withdrawal row is written

#### Scenario: Homepage does not withdraw

- **GIVEN** a connected backer is on `/` with a live horse selected
- **WHEN** they use the homepage slip
- **THEN** the system does not submit `withdraw`

### Requirement: Wrong network blocks the withdraw

The product chain for this flow is Somnia Shannon Testnet. If the connected wallet is on another chain, the system MUST NOT send `withdraw`. It MUST show a wrong-network state and offer a switch to the configured chain.

#### Scenario: Connected on the wrong chain

- **GIVEN** a wallet is connected on a chain other than the configured Somnia testnet
- **WHEN** the backer stamps Withdraw with a valid amount on a live horse
- **THEN** no transaction is sent and the slip shows a wrong-network prompt

#### Scenario: Switch then withdraw

- **GIVEN** the backer was blocked for wrong network
- **WHEN** the wallet is on the configured chain and they stamp again
- **THEN** the system proceeds with `withdraw` as required

### Requirement: Withdraw redeems only the signer’s shares

Withdrawing MUST NOT grant trader or operator rights. The connected signer is the share owner whose shares are burned. The system MUST set `owner` to the connected address and MUST NOT accept a different owner. The operator MUST NOT withdraw depositor funds through this flow. A spectator remains a spectator until they connect and confirm a withdraw of shares they own.

An owner MAY withdraw as a backer only for shares they own. That withdraw MUST NOT redeem other depositors’ funds.

#### Scenario: Backer cannot redeem another depositor

- **GIVEN** a connected wallet that holds shares in a live vault that also has other depositors
- **WHEN** they stamp Withdraw for an amount at or below their own `maxWithdraw`
- **THEN** only that wallet’s shares are burned and other depositors’ shares are unchanged

#### Scenario: Operator is not a withdrawer of depositor funds

- **GIVEN** a connected wallet that is the vault operator but holds no shares
- **WHEN** they open that horse on `/portfolio`
- **THEN** the system does not submit `withdraw` for depositor funds and does not persist a withdrawal row

### Requirement: Withdraw amount cannot exceed maxWithdraw

The system MUST NOT send `withdraw` when `assets` exceed the vault’s `maxWithdraw` for the connected owner. It MUST show an exceeds-max state and MUST NOT persist a row.

#### Scenario: Amount above redeemable assets

- **GIVEN** a connected backer on the configured chain whose stamped amount is greater than `maxWithdraw` for their address
- **WHEN** they stamp Withdraw
- **THEN** no transaction is sent, no withdrawal row is written, and the slip shows an exceeds-max message

### Requirement: Redeemed means a confirmed withdraw

The system MUST wait for a successful receipt. A sent hash is not a withdraw. On success the system MUST read `assets` and `shares` from the receipt (`Withdraw` event). Only then MAY it show a confirmed state (without presenting that withdraw as SYNTHETIC), persist the projection, and update the connected wallet’s remaining book NAV for that horse.

While the transaction is pending, the system MUST show a pending state and MUST NOT present the withdraw as confirmed.

#### Scenario: Confirmed withdraw

- **GIVEN** the backer signed `withdraw`
- **WHEN** the receipt confirms and assets and shares are known
- **THEN** the slip shows confirmed, the projection is stored, and `/portfolio` shows the reduced remaining NAV for that wallet

#### Scenario: Hash sent but not confirmed

- **GIVEN** `withdraw` was submitted
- **WHEN** the transaction is still pending
- **THEN** the UI shows pending and does not show a confirmed withdraw or write a confirmed withdrawal row

### Requirement: Rejected and reverted withdraws stay on the slip

If the user rejects `withdraw`, the RPC fails, or the transaction reverts (including `InvalidAmount`, `ERC4626ExceededMaxWithdraw`, or insufficient idle vault assets), the system MUST keep the slip usable, MUST NOT persist a confirmed withdrawal, and MUST show a distinct error for reject vs revert vs RPC failure.

#### Scenario: User rejects withdraw

- **GIVEN** the wallet is prompting to sign `withdraw`
- **WHEN** the backer rejects the signature
- **THEN** no withdrawal row is written and the slip shows a rejected-transaction message

#### Scenario: withdraw reverts

- **GIVEN** `withdraw` is submitted
- **WHEN** the transaction reverts
- **THEN** the slip stays usable, no confirmed withdrawal row is written, and a reverted message is shown

#### Scenario: RPC failure

- **GIVEN** the backer stamps Withdraw
- **WHEN** the RPC request fails before a receipt
- **THEN** the slip stays usable and an RPC-failure message is shown

### Requirement: Confirmed withdraw is projected

After confirmation the system MUST store a SQLite projection keyed by the withdraw transaction hash, including at least: chain id, vault, owner, receiver, sender, asset, assets in native units, shares in native units, and tx hash. The system MUST validate addresses and amounts on the server before insert. Duplicate transaction hashes MUST NOT create a second row. The horse MUST already exist as an entered bot vault; unknown vaults MUST be rejected.

#### Scenario: Withdraw persisted

- **GIVEN** a confirmed `withdraw` from an entered vault
- **WHEN** the projection is written
- **THEN** a single row exists for that transaction hash with the vault, owner, assets, and shares

#### Scenario: Unconfirmed stamp is not stored

- **GIVEN** the backer filled an amount but `withdraw` has not confirmed
- **WHEN** the page is used
- **THEN** the system does not insert a confirmed withdrawal row for that stamp

#### Scenario: Unknown vault is not stored

- **GIVEN** a client posts a withdrawal whose vault is not an entered bot
- **WHEN** the server handles persist
- **THEN** no withdrawal row is written

### Requirement: Chain wins on withdraw conflict

If the stored projection disagrees with chain state for the same withdrawal (vault, owner, receiver, assets, shares, or tx), the system MUST treat chain as source of truth and MUST NOT present the stale projection as settled fact.

#### Scenario: Withdrawal projection disagrees with chain

- **GIVEN** a withdrawal row exists for a transaction hash
- **WHEN** chain state for that receipt differs from the row
- **THEN** the UI does not present the conflicting projected fields as confirmed chain fact

### Requirement: Book remaining NAV comes from confirmed withdraws

`/portfolio` MUST reduce a connected wallet’s live BACKED capital by confirmed withdrawals from entered vaults, not from a local-only book mutation. After a confirmed withdraw, remaining NAV MUST reflect deposits minus withdrawals for that wallet and vault, or the chain `maxWithdraw` / share-to-asset conversion when those are read. If remaining redeemable assets are zero and the wallet is not the vault owner, the horse MUST NOT stay listed as BACKED. Owner-only (MINE, not backed, `maxWithdraw` zero) rows MUST remain watch-only.

#### Scenario: Confirmed withdraw updates the book

- **GIVEN** a connected backer confirmed a withdraw on `/portfolio`
- **WHEN** the book reloads with the same wallet
- **THEN** that horse’s remaining NAV for that wallet is reduced by the withdrawn assets

#### Scenario: Local book mutation is not the live withdraw

- **GIVEN** a live entered vault
- **WHEN** a connected backer confirms an on-chain withdraw
- **THEN** the remaining position is stored as a verified projection and is not solely a sessionStorage decrement
