## 1. Chain config and wallet session

- [x] 1.1 Add `PUBLIC_SOMNIA_RPC_URL`, `PUBLIC_VAULT_FACTORY_ADDRESS`, `PUBLIC_VAULT_ASSET_ADDRESS`, and optional `SOMNIA_RPC_URL` to `.env.example` (and local `.env`). Fail closed in the config module if factory or asset is missing/invalid.
- [x] 1.2 Add `$lib/wallet/chains.ts` for Somnia Shannon Testnet (`id: 50312`, native `STT`) and a single `$lib/chain/config.ts` that reads public addresses/RPC. Point `walletConfig` at this chain only (drop mainnet).
- [x] 1.3 Extend `$lib/wallet/session.svelte.ts` with `chainId` and `switchToProductChain()` (`switchChain`, then add the chain if the wallet does not know it). Do not auto-prompt on load.

## 2. SQLite bot schema

- [x] 2.1 Add a `bot` table in `src/lib/server/db/schema.ts` per design.md (keep `task`). Amounts as text native units; unique `vault_address` and `tx_hash`.
- [x] 2.2 Run `bun run db:generate` and apply with `bun run db:migrate` (or `bun run db:push` locally) so the table exists.

## 3. Client createVault path

- [x] 3.1 Add typed factory + ERC-20 ABI fragments and helpers under `$lib/chain` (`parseUnits` purse, symbol from name, `readContract` decimals/allowance, exact `approve` when seed > 0, `simulateContract` then `writeContract` `createVault`, `waitForTransactionReceipt`, decode `VaultCreated`). Amounts stay `bigint`. Never import `$lib/server`.
- [x] 3.2 Map wallet/RPC outcomes to the lifecycle union (`idle` / `wrong_network` / `approving` / `pending` / `confirmed` / `rejected` / `reverted` / `rpc_error`), including user-rejected approve, `OperatorExists`, and simulate failures before send.

## 4. Server projection

- [x] 4.1 Add `POST` `src/routes/enter/+server.ts` that validates body (addresses, chain id, seed integer string, market, name/strategy, tx hash), fetches the receipt via server public client, requires successful `VaultCreated` matching the body, then inserts. Idempotent on vault/tx unique conflict. Server never signs or submits `createVault`.

## 5. Enter page wiring

- [x] 5.1 Add Paraglide strings in `messages/en.json` and `messages/id.json` for wrong network, switch, pending, rejected approve/tx, reverted, RPC failure, missing asset config, invalid operator, creator vs bot-wallet on the receipt. Do not name Somnia in sheet copy.
- [x] 5.2 Wire `/enter` Open vault to the client path: block spectator (existing ConnectGate), block/wrong-network switch, validate other-address operator with `viem` `isAddress`, disable stamp while approving/pending, show pending without an entered receipt, persist only after confirm, `saveEnteredHero` with vault address as id, drop SYNTHETIC on the confirmed purse, show creator vs operator without calling the operator a depositor.

## 6. Verify

- [x] 6.1 Run `bun run check` and `bun run format` (then `bun run lint`) on touched files; fix type and format issues.
- [ ] 6.2 Manual wallet pass on Somnia testnet: disconnected stamp → connect; wrong network → switch; reject approve; reject `createVault`; confirm seed `createVault` and confirm SQLite row + see-on-card; retry POST is idempotent; other-address operator shows on the receipt.
