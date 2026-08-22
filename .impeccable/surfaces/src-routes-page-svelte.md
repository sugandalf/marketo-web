---
version: 1
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: ["src/app.html","src/routes/+layout.svelte","src/routes/form.css"]
---

# Landing — The Call

Visitor mode: Persuade. Primary target: `src/routes/+page.svelte`.

Audience: a first-time visitor with a wallet who wants to back someone else's BTC/ETH event-market bot. Bot-creators are a second audience.

Job: deposit into a named hero's vault without creating a bot. Proof is the racing-form call: past performances vs BTC/ETH, vault purse, labeled SYNTHETIC until chain data exists. dreamDEX is named as the event market.

Direction: Daily Racing Form world. Composition **The Call** — one selected horse owns the fold; the rest of the program is a pickable strip; BACK THIS HORSE slip sits on the right. Approved comp: `.impeccable/mocks/landing-call.webp`. Comp-led.

Memorable moment: WARDEN (or the selected hero) at giant program-entry scale, Deposit as a green rubber stamp.

Constraints: non-custodial; do not invent volume/users/TVL/press; opponent is always BTC or ETH; create-bot is secondary (Enter a horse). Copy through Paraglide.

Unresolved: live wallet adapter and contract addresses; empty roster when no heroes exist on-chain.

## Inventory (implementation)

| Region | Medium |
|---|---|
| Newsprint ground (fiber, grain; ~full bleed) | Raster `static/landing/newsprint.webp` + CSS tile |
| MARKETO / horse names / program numbers | Self-hosted Big Shoulders Display (extra-condensed athletic) |
| Agate past-performance / labels | Self-hosted Barlow Condensed |
| BTC/ETH silks | CSS filled squares + type |
| Horse+jockey mark | Authored SVG |
| Deposit stamp | Interactive HTML button; double-rule + stamp rotation; not a raster of the word |
| Slip, inputs, program strip | Semantic HTML/CSS |
| Hero portraits | Omitted — comp portraits are not product truth; silks carry identity |
| Primary action | Stamp button in the slip |

Sampled from approved comp (1536×1024 interior patches):
- Paper `#e6d8c6` (center) / `#f3eadc` (hot sheet)
- Ink `#040303`
- Purse/stamp green `#085324`
- ETH silk `#0756d0`
- BTC silk `#e42c22`

## Compositional commitments

- Nav: MARKETO, date, dreamDEX line, Enter a horse. No Markets/Vaults/Docs chrome.
- Headline scale: MARKETO masthead < selected horse name (the name is the display).
- Signature: thick black rules, silks squares, stamp Deposit, warm newsprint sheet.
- First viewport: masthead / call+slip / program strip.
