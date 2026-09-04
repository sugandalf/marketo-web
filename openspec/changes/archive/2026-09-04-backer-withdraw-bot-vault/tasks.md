## 1. SQLite withdrawal schema

- [x] 1.1 Add a `withdrawal` table in `src/lib/server/db/schema.ts` per design.md (keep `bot`, `deposit`, and `task`). Amounts as text native units; unique `tx_hash`; checksummed vault/owner/receiver/sender/asset.
- [x] 1.2 Run `bun run db:generate` and apply with `bun run db:migrate` (or `bun run db:push` locally) so the table exists.

## 2. Client withdraw path

- [x] 2.1 Extend `$lib/chain/botVault.ts` with typed ERC-4626 fragments (`withdraw`, `maxWithdraw`, `previewWithdraw`, `convertToAssets`, `balanceOf`, `Withdraw`, `ERC4626ExceededMaxWithdraw`). Keep existing deposit fragments.
- [x] 2.2 Add `$lib/chain/withdrawVault.ts`: parse amount with `parseUnits`, require connected account, verify vault `asset()` matches config, read `maxWithdraw(owner)`, `simulateContract` then `writeContract` `withdraw(assets, receiver, owner)` with receiver and owner = connected address, wait for receipt, decode `Withdraw`. Amounts stay `bigint`. No `approve`. Never import `$lib/server`.
- [x] 2.3 Reuse `classifyWriteError` for reject/revert/RPC (map `ERC4626ExceededMaxWithdraw` / `InvalidAmount` to reverted). Throw before send when amount is 0 or `assets > maxWithdraw`. Add a client persist helper that `POST`s JSON to `/withdraw`.

## 3. Server projection

- [x] 3.1 Add `$lib/server/withdrawals.ts` plus `POST` `src/routes/withdraw/+server.ts`: validate body (addresses, chain id, assets/shares integer strings, tx hash), require an existing `bot` row for the vault/asset, fetch the receipt via server public client, require successful `Withdraw` matching the body (`owner` = withdrawer), then insert. Idempotent on `tx_hash`. Reject unknown vaults. Server never signs or submits `withdraw`.
- [x] 3.2 Add list helpers for withdrawal rows (all, by vault, by owner).

## 4. Book remaining capital

- [x] 4.1 Load withdrawals in `loadField()` / roster. Purse TVL = seed + deposits − withdrawals (floor at 0). Return withdrawals on `/portfolio` (and other field loads that share the helper).
- [x] 4.2 Update `liveBookEntries` so BACKED capital is `max(0, deposits − withdrawals)` for the connected wallet. Drop BACKED when remaining is 0 and the wallet is not the creator. Do not call `applyWithdraw` / `saveBook` for live vaults.

## 5. Slip copy and wiring

- [x] 5.1 Add Paraglide strings in `messages/en.json` and `messages/id.json` for pending, rejected, reverted, RPC failure, exceeds max, not a live vault, and confirmed withdraw. Reuse existing wrong-network / connect-to-sign-withdraw copy. Do not name Somnia in sheet copy.
- [x] 5.2 Add `$lib/chain/withdrawFlow.ts` (phase union including `exceeds_max` / `not_live`) and `WithdrawStatus.svelte`: block spectator (existing ConnectGate), block/wrong-network switch, disable Withdraw while pending, skip persist until confirm, drop SYNTHETIC on the confirmed amount. Keep the 1px outlined Withdraw.
- [x] 5.3 Wire `/portfolio` WITHDRAW to that runner. Read `maxWithdraw(connected)` when a live overlay opens; use it as the slip max and as whether Withdraw is offered (including creator-only when that value is greater than zero). Zero amount stays on the slip. Synthetic horses keep `applyWithdraw`. Homepage and program MUST NOT send `withdraw`. After confirm, remaining NAV updates and owner-only with `maxWithdraw` 0 stays watch-only.

## 6. Verify

- [x] 6.1 Run `bun run check` and `bun run format` (then `bun run lint`) on touched files; fix type and format issues.
- [ ] 6.2 Manual wallet pass on Somnia testnet: disconnected Withdraw on `/portfolio` → connect; synthetic horse does not send a chain tx; live horse wrong network → switch; reject `withdraw`; amount above `maxWithdraw`; confirm backer `withdraw` and confirm SQLite row + reduced NAV; creator with shares can withdraw only their `maxWithdraw`; creator with `maxWithdraw` 0 stays watch-only; operator with no shares cannot pull depositor funds; retry POST is idempotent.
