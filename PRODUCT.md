# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles are first-class from day one; the product is incomplete if any is missing.

- **Event-market trader:** takes yes/no or two-sided positions on event outcomes with their own wallet and capital.
- **Vault depositor:** supplies capital, holds shares, and tracks NAV; does not automatically gain trader rights.
- **Authorized vault trader:** allocates depositor capital into markets under protocol rules; cannot withdraw depositor funds except through those rules.

A disconnected visitor is a spectator until they connect a wallet. Primary design does not pick a single role to ship first.

## Product Purpose

Marketo is the user-facing web client for on-chain event markets (prediction / binary options) and vaults on EVM. Users connect a wallet, read chain state, and submit their own signed transactions.

It exists so people can take event positions, deposit capital for others to trade, and allocate that capital — with prices, odds, positions, PnL, settlement, deposits, withdrawals, shares/NAV, and allocations reconcilable on-chain.

Success is a user completing a trade, deposit, withdrawal, or allocation with a confirmed receipt, and being able to reconstruct balances and roles from chain state. The app is not the protocol: it does not sign for users, hold private keys, or invent off-chain matching unless a later change explicitly requires it.

## Positioning

Trading is presented as a game-like arena: heroes fight a dragon, and the dragon is the market. That visualization is a product commitment, not a later skin.

The underlying mechanism (repo-stated, confirmed by shipping all three roles together): depositors fund authorized traders who trade event markets; depositor, trader, and vault accounting stay distinct and on-chain. Competitive claim vs a generic prediction-market or vault product is otherwise **undecided**.

## Operating Context

- Browser + EVM wallet (connect, chain mismatch, rejected / reverted txs, RPC failure).
- Reads from chain (and optional SQLite projections); writes are user-signed in the browser.
- Locales in the repo: `en` and `id` via Paraglide. Whether both are a hard product requirement is **undecided** (not confirmed in init).
- Target EVM chain(s) are **undecided**; do not name a chain until chosen.
- Current UI: racing-form landing (`src/routes/+page.svelte`), full program tote (`src/routes/program/+page.svelte`), and Enter a horse (`src/routes/enter/+page.svelte`). Wallet connect is demo-only until a chain adapter exists.

## Capabilities and Constraints

Confirmed:

- Non-custodial. The app never holds keys and never signs or submits a trade, deposit, or withdrawal on the user’s behalf.

Repo-stated (treat as product facts unless a later change overrides):

- Surface market prices, odds, positions, PnL, and settlement from on-chain market state.
- Vaults: deposits, withdrawals, shares/NAV, allocations, and PnL must be reconcilable on-chain.
- SQLite is a projection (history, search, leaderboards) if used; chain wins on conflict.
- Amounts are native units on chain (`bigint`); display formatting is a view concern.

Undecided:

- Which EVM chain(s) and which contract deployment this client targets.
- Whether English and Indonesian are both required in shipped UI.
- Accessibility standard (none set).
- Protocol-level matching, fees, market creation, and listing rules (not specified here).

## Brand Commitments

- Product name: **Marketo**.
- Binding visualization: game-like trading — an arena of heroes fighting a dragon that stands for the market. Do not drop this for a conventional order-ticket or dashboard metaphor. Do not invent extra lore, characters, or claims beyond this constraint.
- Type on shipped screens: extra-condensed athletic gothic (Big Shoulders Display) with agate condensed (Barlow Condensed), recorded in DESIGN.md. The favicon is still the Svelte scaffold mark, not a brand asset.
- User-facing copy in the repo is intended to go through Paraglide rather than hardcoded strings (stack convention).

## Evidence on Hand

None. No live markets, contract addresses, screenshots of real trading, testimonials, case studies, or Marketo brand assets. Future work must not fabricate customers, volume, odds, or press.

Shipped screens: `src/routes/+page.svelte` (racing card), `src/routes/program/+page.svelte` (overnight tote + Hot Sheet overlay), `src/routes/enter/+page.svelte` (entry papers). Demo Paraglide and `task` table remain in `src/routes/demo/**` and `src/lib/server/db/schema.ts`. Messages in `messages/en.json` and `messages/id.json`.

## Product Principles

1. **Ship the three roles together.** Markets without vaults, or vaults without markets, are not Marketo.
2. **The user always signs.** No custodial shortcuts, no server-submitted user trades or deposits.
3. **The arena is the trading surface.** Heroes vs the market-as-dragon is how trading is understood, not decoration on a standard ticket.
4. **Chain is what happened.** UI may estimate and pending-state; it must not present unconfirmed or rounded figures as settled fact.
5. **Roles stay distinct.** Depositor, authorized trader, and spectator are not collapsed into one “user with a wallet.”
