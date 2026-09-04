## 1. SQLite deposit schema

- [x] 1.1 Add a `deposit` table in `src/lib/server/db/schema.ts` per design.md (keep `bot` and `task`). Amounts as text native units; unique `tx_hash`; checksummed vault/depositor/sender/asset.
- [x] 1.2 Run `bun run db:generate` and apply with `bun run db:migrate` (or `bun run db:push` locally) so the table exists.

## 2. Client deposit path

- [x] 2.1 Add `$lib/chain/botVault.ts` with typed ERC-4626 fragments (`deposit`, `maxDeposit`, `asset`, `previewDeposit`, `Deposit`, `InvalidAmount`, `DepositCapExceeded`).
- [x] 2.2 Add `$lib/chain/depositVault.ts`: parse amount with `parseUnits`, require connected account, verify vault `asset()` matches config, read `maxDeposit(receiver)`, exact ERC-20 `approve` to the **vault** when allowance is short, `simulateContract` then `writeContract` `deposit(assets, receiver)`, wait for receipt, decode `Deposit`. Amounts stay `bigint`. Never import `$lib/server`.
- [x] 2.3 Reuse `classifyWriteError` for reject/revert/RPC. Throw before send when amount is 0 or `assets > maxDeposit`. Add a small client persist helper that `POST`s JSON to `/deposit`.

## 3. Server projection

- [x] 3.1 Add `$lib/server/deposits.ts` plus `POST` `src/routes/deposit/+server.ts`: validate body (addresses, chain id, assets/shares integer strings, tx hash), require an existing `bot` row for the vault/asset, fetch the receipt via server public client, require successful `Deposit` matching the body (`owner` = depositor), then insert. Idempotent on `tx_hash`. Reject unknown vaults. Server never signs or submits `deposit`.
- [x] 3.2 Add list helpers for entered bots and deposit rows (by vault and by depositor). Map bot rows to the existing `Hero` shape with `id` = vault address and a live flag.

## 4. Load live horses

- [x] 4.1 Add `+page.server.ts` on `/`, `/program`, and `/portfolio` that return entered bots plus deposit projections. Merge live horses ahead of the synthetic roster; synthetic horses stay non-depositable.
- [x] 4.2 Derive last-backer on `/program` from the latest deposit row for that vault. On `/portfolio`, filter deposit rows to the connected wallet after connect, sum assets per vault for BACKED capital, and do not call `applyDeposit` / `saveBook` for live vaults. Owner-only rows stay watch-only.

## 5. Slip copy and wiring

- [x] 5.1 Add Paraglide strings in `messages/en.json` and `messages/id.json` for wrong network, switch, pending, rejected approve/tx, reverted, RPC failure, cap exceeded, not a live vault, and confirmed deposit. Do not name Somnia in sheet copy.
- [x] 5.2 Extract one slip-side deposit runner (phase union including `cap_exceeded` / `not_live`) used by all three pages: block spectator (existing ConnectGate), block/wrong-network switch, disable stamp while approving/pending, skip persist until confirm, drop SYNTHETIC on the confirmed amount, keep `deposit-stamp.webp`.
- [x] 5.3 Wire `/`, `/program`, and `/portfolio` Deposit stamps to that runner. Zero amount stays on the slip. Portfolio withdraw remains unwired. After confirm, `/portfolio` lists the horse as BACKED for that wallet.

## 6. Verify

- [x] 6.1 Run `bun run check` and `bun run format` (then `bun run lint`) on touched files; fix type and format issues.
- [ ] 6.2 Manual wallet pass on Somnia testnet: disconnected stamp on each of `/`, `/program`, `/portfolio` → connect; synthetic horse does not send; wrong network → switch; reject approve; reject `deposit`; amount above `maxDeposit`; confirm `deposit` and confirm SQLite row + BACKED on `/portfolio`; retry POST is idempotent; owner deposit does not enable pulling other depositors’ funds.
