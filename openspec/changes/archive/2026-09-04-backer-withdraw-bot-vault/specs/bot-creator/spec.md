## ADDED Requirements

### Requirement: Creator may withdraw only their own capital

A connected vault creator MAY redeem capital they own in that vault: shares minted to them at seed, and shares from any deposit they made as a backer. The system MUST send that `withdraw` only as a user-signed transaction from the creator’s wallet, with `receiver` and `owner` equal to the connected creator. The server MUST NOT hold a key or submit `withdraw` on their behalf.

Owning the vault MUST NOT let the creator redeem other depositors’ funds. If the creator’s `maxWithdraw` is zero, the `/portfolio` overlay MUST stay watch-only (no Withdraw). When `maxWithdraw` is greater than zero, the overlay MAY show Withdraw for that owner’s redeemable assets only.

#### Scenario: Creator redeems their own shares

- **GIVEN** the connected wallet is the vault creator and `maxWithdraw` for that address is greater than zero
- **WHEN** they stamp Withdraw on `/portfolio` with a valid positive amount at or below that `maxWithdraw` and confirm in the wallet
- **THEN** `withdraw` is submitted with `receiver` and `owner` equal to the creator and a withdrawal row is stored after confirmation

#### Scenario: Creator cannot pull other depositors

- **GIVEN** the connected wallet is the vault creator and other wallets hold shares in the same vault
- **WHEN** they stamp Withdraw
- **THEN** the amount sent cannot exceed the creator’s own `maxWithdraw` and other depositors’ shares are unchanged

#### Scenario: Owner-only with nothing to redeem stays watch-only

- **GIVEN** the connected wallet is the vault creator, is not a backer, and `maxWithdraw` for that address is zero
- **WHEN** they open that horse on `/portfolio`
- **THEN** the overlay stays watch-only, no `withdraw` is sent, and no withdrawal row is written
