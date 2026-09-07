# Marketo

Marketo is how people create trading bots and back them with capital on [dreamDEX](https://dreamdex.io) event markets (BTC / ETH). The app never holds keys. Creators, operators, and backers each sign their own transactions.

## 1. Problem we solve

dreamDEX needs **volume**. Volume comes from capital that is actually in the book: bots that place and redeem, and backers who keep those bots funded.

Marketo’s north star is to **increase dreamDEX volume** by making two roles easy:

| Role | What they do | Why volume grows |
| --- | --- | --- |
| **Bot creator** | Names a bot, opens an on-chain vault, and runs an operator that trades the vault’s idle collateral on dreamDEX | Every fill, mint, and redeem is venue volume |
| **Backer** | Deposits the vault asset into a live bot and later withdraws their own NAV | More TVL means larger orders the operator can send to dreamDEX |

Roles stay distinct. Depositing does not make you the trader. Operating the bot does not let you pull other people’s funds. The creator owns the vault; the operator trades it; backers hold shares.

```
  creator ──opens vault──►  vault TVL  ◄──deposits──  backers
                                │
                                │  operator spends idle collateral
                                ▼
                         dreamDEX event markets
                         (BTC / ETH  Yes / No)
                                │
                                ▼
                         fills + settlement  =  volume
```

## 2. Create a bot

A creator files papers on `/enter` and **opens a vault**. The bot is not on the card until `createVault` confirms. Seed comes from the creator’s own asset balance; that seed is not a backer deposit.

**Simple path**

1. Connect a wallet on Somnia Shannon Testnet.
2. Name the bot, pick silks (BTC or ETH), write a strategy, choose the bot wallet (same as creator, or another operator address).
3. Set an opening purse greater than zero.
4. Approve the factory if needed, then sign `createVault`.
5. After confirmation, the vault is live. An operator process (`bot-dreamdex`) can spend that vault on dreamDEX. A separate indexer (`bot-performance`) publishes TVL, PnL, and past arenas to `/` and `/program`.

### TVL rules

- **Opening purse** is the creator’s seed. It is the floor of the vault, not profit.
- **Max TVL** is **5× the opening purse**. That cap is what backers fill against (`maxDeposit`). When the purse is at max, the bot stops taking deposits.
- **Live TVL** is idle collateral plus marked outcome inventory on dreamDEX — not “seed + deposits − withdrawals”.
- Fee shares minted to the creator / Marketo are **not** opening purse and **do not** raise the cap.
- The creator may later deposit as a backer; they still cannot redeem anyone else’s shares.

### Performance fee

There is **no** management, deposit, or withdrawal fee. The creator is paid only when the vault makes **new realized profit**.

| Rule | Detail |
| --- | --- |
| Rate | 0–20%, locked at create. Opening purse is not profit. |
| High-water mark | Fee only when share price beats its peak. Flat, down, or climbing back: no fee. |
| What counts | Realized value: idle collateral, venue escrow, and matched Yes + No. An unmatched pile of one side does not count. |
| How it is paid | Extra vault shares, not cash. 80% to the creator’s fee recipient, 20% to Marketo. Backers keep the rest. |

### Vault + dreamDEX

```
  Creator                 Factory                 Vault                    dreamDEX
    |                        |                      |                         |
    |  papers on /enter      |                      |                         |
    |  approve asset ───────>|                      |                         |
    |  sign createVault ────>|  deploy + seed ─────>|                         |
    |                        |  VaultCreated        |                         |
    |<── vault address ──────|                      |                         |
    |                                               |                         |
    |            Operator (bot wallet)              |                         |
    |                 |                             |                         |
    |                 |  placeOrder / redeem        |                         |
    |                 |  (vault is the trader)      |                         |
    |                 |────────────────────────────>|  BTC/ETH event windows  |
    |                 |                             |────────────────────────>|
    |                 |                             |  fills / settlement     |
    |                 |                             |<────────────────────────|
    |                                               |                         |
    |            Indexer (read-only)                |                         |
    |                 |  idle + marks = TVL / PnL   |                         |
    |                 |<────────────────────────────|                         |
    |                 └──────────────►  /  and  /program  card
```

The web app never holds the operator key and never places orders. The operator never calls `deposit` or `withdraw`.

## 3. Deposit as a backer

A backer funds a **live entered vault** (not a demo horse) from `/`, `/program`, or `/portfolio`. They receive ERC-4626 shares. They do not become the operator.

**Simple path**

1. Connect a wallet on Somnia Shannon Testnet.
2. Pick a live bot. Enter an amount at or below remaining `maxDeposit`.
3. Approve the **vault** (not the factory) if allowance is short, then sign `deposit`. Shares mint to the connected wallet.
4. The operator trades with vault idle collateral on dreamDEX. Share price moves with **realized** vault profit.
5. Redeem on `/portfolio` only: sign `withdraw` for an amount at or below your own `maxWithdraw`. Homepage and program do not withdraw.

### How a backer makes profit

Profit is **what your shares are worth minus what you deposited**.

- Shares gain only on **realized new profit**, above the last peak (same high-water mark as the performance fee).
- Unmatched Yes or No inventory does not count as profit.
- Any performance fee comes out of that profit first. You keep the rest.
- No deposit or withdrawal fee. You still pay chain gas.
- You can only redeem **your** shares. The creator cannot pull other backers. The operator cannot withdraw depositor funds.

### Deposit and withdraw

```
  Backer                    Vault                      Operator / dreamDEX
    |                         |                              |
    |  pick live bot          |                              |
    |  approve vault ────────>|                              |
    |  deposit(assets) ──────>|  mint shares to backer       |
    |                         |  assets become idle TVL      |
    |                         |─────────────────────────────>|
    |                         |  trade Yes/No windows        |
    |                         |<─────────────────────────────|
    |                         |  realized PnL → share NAV    |
    |                         |  fee on new high-water only  |
    |                         |                              |
    |  /portfolio             |                              |
    |  withdraw(assets) ─────>|  burn your shares            |
    |<── assets to wallet ────|  other backers unchanged     |
```

Deposit cap is the remaining room under **5× seed**. Withdraw is capped by **your** redeemable NAV (`maxWithdraw`). A sent hash is not a deposit or a redeem — only a confirmed receipt is.

## 4. Example bot (`examples/dreamdex-vault-bot`)

The web app opens vaults and takes deposits. It does **not** trade. Trading is a separate long-running operator in [`examples/dreamdex-vault-bot`](examples/dreamdex-vault-bot). That process spends **vault** tUSDC on dreamDEX event markets. The operator EOA pays STT gas only.

Strategy: [ec-oracle-follow](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-oracle-follow) to open, [ec-settlement](https://github.com/somnia-chain/dreamdex-bot-kit/tree/main/strategies/ec-settlement) to redeem. Writes go through the vault adapter (`placeOrder`, `redeem`, `syncMarket`, …). There is no `exchange.trader`. A bearish view is `BUY_NO`, never `SELL_YES`.

The adapter never wraps `deposit`, `withdraw`, `mint`, or share redeem. Homepage and `/program` do not read this bot’s logs — TVL and PnL come from `bun run bot:performance`.

### Integrate with a Marketo vault

The example is not a generic wallet trader. Point it at a vault you opened on `/enter`.

1. On `/enter`, set **bot wallet** to the address of `OPERATOR_PRIVATE_KEY` (“same as creator” if that wallet is the operator, otherwise “other address”).
2. Open the vault. Copy the confirmed **vault address**.
3. Vault `asset()` must be **tUSDC** (same token as dreamDEX event collateral). Mismatch → markets are skipped.
4. Fund the **vault** with tUSDC (seed plus any backer deposits). Fund the **operator** with STT for gas.
5. Put both in the repo `.env` (never `PUBLIC_*`):

```
VAULT_ADDRESS=0x...              # vault from createVault
OPERATOR_PRIVATE_KEY=0x...       # must equal vault.operator()
DRY_RUN=false
EC_UNDERLYING=ETH
EC_INTERVAL=15m,1h
```

6. Dry-run first (`DRY_RUN` defaults to true), then go live:

```bash
bun run bot:dreamdex
```

If the key is not the on-chain operator, writes fail closed. One operator key maps to one vault (`OperatorExists` on create). Optional knobs (`OF_EDGE`, `OF_MIN_ASK`, `OF_MAX_SHARES`, …) are listed in the [example README](examples/dreamdex-vault-bot/README.md).

```
  /enter createVault
       │
       │  operator = bot wallet
       │  asset    = tUSDC
       ▼
  Marketo vault ◄──── backer deposit / withdraw (web, user-signed)
       │
       │  VAULT_ADDRESS + OPERATOR_PRIVATE_KEY
       ▼
  examples/dreamdex-vault-bot
       │  vault.placeOrder / redeem / syncMarket
       ▼
  dreamDEX BTC/ETH windows
```

Compile without Bun on the host: `bun run compile:bot:dreamdex` → `dist/bot-dreamdex`. State (`markets.json`) lives under `BOT_STATE_DIR` or `./.state`. Run `bun run bot:performance` beside the web app so the card shows live TVL and fights.
