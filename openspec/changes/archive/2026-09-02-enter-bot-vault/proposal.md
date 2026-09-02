## Why

`/enter` already files bot papers (name, silks, strategy, operator wallet, opening purse) but only writes a synthetic horse to `sessionStorage`. Creating a bot is supposed to open an on-chain vault others can back. This change wires that stamp to the Somnia testnet factory so a confirmed `createVault` is what “entered” means, and SQLite keeps a projection plus the off-chain papers the chain does not store.

## What Changes

- Point the Wagmi client at **Somnia Shannon Testnet** (chain ID 50312) as the product chain for this flow.
- On Open vault, the connected wallet signs [factory `createVault`](https://somnia.w3us.site/address/0x6EbBD76076faE4FBaD7C4B5bc9c8c6feeB82e4a9?tab=write_contract#0x463704cd) (`0x6EbBD76076faE4FBaD7C4B5bc9c8c6feeB82e4a9`). If the opening purse is greater than zero, the user first signs an ERC-20 `approve` of the configured vault asset to the factory.
- Parse `VaultCreated` (or the returned vault address) from a confirmed receipt. Do not treat a sent hash as success.
- Add a Drizzle SQLite table for created bots/vaults (on-chain ids plus papers metadata). Persist only after confirmation. Chain wins on conflict.
- Keep the condition-book enter UI. Replace demo “vault opened” copy and SYNTHETIC purse on the receipt with pending / confirmed / rejected / reverted states. Keep the see-on-card handoff after a confirmed vault.
- Add Paraglide copy for chain mismatch, allowance, and tx outcomes.

This is **on-chain write + SQLite projection + enter-page wiring**. No protocol/ABI changes; the factory is already deployed. Client uses the published ABI.

## Non-goals

- Depositor deposit/withdraw, trader allocation, or market trades.
- Replacing the landing/program synthetic roster with a live vault index (only the just-entered horse handoff).
- Performance-fee or asset pickers on the papers.
- Custodial or server-submitted `createVault`.
- Removing the demo `task` table.

## Capabilities

### New Capabilities

- `bot-creator`: Enter-page bot creation — user-signed `createVault` on Somnia testnet, ERC-20 seed allowance, SQLite projection of confirmed vaults plus papers metadata, and receipt states that distinguish spectator / creator / operator.

### Modified Capabilities

- (none)

## Impact

- **Wallet / chain:** Product chain becomes Somnia testnet. Wrong network, disconnect, reject, revert (`OperatorExists`, allowance, insufficient balance), and RPC failure are first-class. The server never holds keys or submits the tx.
- **Funds:** `seedAssets` pulls the configured ERC-20 from the signer after approve. Amounts stay `bigint` on chain and in SQLite; UI formats USDso.
- **Code:** `src/routes/enter/+page.svelte`, `$lib/wallet/config.ts`, new chain/ABI/write helpers, `src/lib/server/db/schema.ts`, persist endpoint or remote function, `.env.example`, `messages/en.json` + `messages/id.json`.
- **Config:** Public factory address, vault asset address, RPC, and chain id — not hardcoded across routes.
- **Assumptions:** Vault asset is a single env-configured ERC-20 matching the USDso purse; `performanceFeeBps` is `0`; `symbol_` is derived from the horse name; `creatorFeeRecipient` is the connected wallet; bot-wallet “other address” is `operator`.
