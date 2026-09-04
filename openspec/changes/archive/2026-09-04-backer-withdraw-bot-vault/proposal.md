## Why

`/portfolio` already chips WITHDRAW and outlines redeem on a backed horse, but live vaults never send a chain write — only synthetic book rows mutate `sessionStorage`. Backers and creators who hold shares still cannot take their own capital out of an entered `BotVault`. This change makes a confirmed ERC-4626 `withdraw` the meaning of redeeming the book, and stores that withdrawal as a verified SQLite projection.

## What Changes

- On the `/portfolio` Hot Sheet WITHDRAW stamp (outlined, not a rubber stamp), the connected wallet signs `withdraw(assets, receiver, owner)` on the selected live vault. `receiver` and `owner` are the connected address. Amounts stay `bigint` native units on chain; the slip still formats USDso.
- Honor `maxWithdraw(owner)` before sending. Parse the ERC-4626 `Withdraw` event from a confirmed receipt. Do not treat a sent hash as success.
- A backer redeems only their own shares. A vault creator MAY redeem their own shares (including seed shares the vault minted to them, and any deposit they made as a backer). Neither MAY redeem another depositor’s funds. The operator MUST NOT withdraw depositor funds through this flow.
- Owner-only overlays stay watch-only when `maxWithdraw` is zero. When the connected owner has redeemable assets, the overlay MAY show Withdraw for that owner’s NAV only.
- Add a Drizzle SQLite table for confirmed withdrawals (vault, owner, receiver, sender, assets, shares, tx). Persist only after the server verifies the receipt. Chain wins on conflict.
- After a confirmed withdraw, `/portfolio` NAV and BACKED capital come from the net projection (and chain `maxWithdraw` / `convertToAssets` when read), not from `applyWithdraw` / sessionStorage. Synthetic demo horses keep the local book mutation.
- Keep the existing book tote, invert chips, and outlined Withdraw. Add pending / confirmed / rejected / reverted / wrong-network / exceeds-max / not-live states. Add Paraglide copy.

This is **on-chain write + SQLite projection + portfolio slip wiring**. No protocol changes; `BotVault` already implements ERC-4626 `withdraw`. Client uses the published vault ABI (extended fragments). Homepage and program deposit slips are unchanged.

## Non-goals

- Deposit, `createVault`, trader allocation, or market trades.
- Adding Withdraw to `/` or `/program`.
- Third-party redeem (`owner` ≠ connected wallet) or operator pulling depositor funds.
- Redesigning the book tote or replacing the synthetic demo roster.
- Custodial or server-submitted `withdraw`.
- Share-denominated `redeem` as the slip action (the amount field is assets / USDso).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `bot-depositor`: Connected backer redeems their own vault capital on `/portfolio` via user-signed ERC-4626 `withdraw`, with SQLite projection of confirmed withdrawals, distinct spectator / backer / owner / operator behavior, and the book reflecting remaining NAV.
- `bot-creator`: Vault creator MAY withdraw only their own capital (seed shares and/or their own deposits). Opening or owning a vault still MUST NOT let them redeem other depositors’ funds.

## Impact

- **Wallet / chain:** Same product chain as enter/deposit (Somnia Shannon Testnet). Wrong network, disconnect, reject, revert (`InvalidAmount`, `ERC4626ExceededMaxWithdraw`, insufficient idle assets), and RPC failure are first-class. The server never holds keys or submits the tx. No ERC-20 `approve` for withdraw.
- **Funds:** `withdraw` burns the signer’s shares and sends the configured ERC-20 to that same address. Other depositors’ shares are untouched. Operator rights are unchanged.
- **Code:** Shared withdraw helper in `$lib/chain`, vault ABI fragments, persist endpoint, `src/lib/server/db/schema.ts`, roster/book remaining-capital math, `/portfolio` slip wiring, `messages/en.json` + `messages/id.json`.
- **Assumptions:** Withdraw targets are confirmed `bot` rows. Slip amount is assets, not shares. Exact `assets` ≤ `maxWithdraw(connected)`. Synthetic horses remain browse-only for this write.
