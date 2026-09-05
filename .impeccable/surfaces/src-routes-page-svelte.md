---
version: 1
slug: 'src-routes-page-svelte'
primary_target: 'src/routes/+page.svelte'
related_targets:
  [
    'src/app.html',
    'src/routes/+layout.svelte',
    'src/routes/form.css',
    'src/routes/enter/+page.svelte'
  ]
---

# Landing — The Call

Visitor mode: Persuade. Primary target: `src/routes/+page.svelte`.

Audience: a first-time visitor with a wallet who wants to back someone else's BTC/ETH event-market bot. Bot-creators leave via masthead to `/enter`.

Job: deposit into a named hero's vault without creating a bot. Proof is the racing-form call: past performances vs BTC/ETH, total PnL beside vault purse, labeled SYNTHETIC until chain data exists. dreamDEX is named as the event market.

Direction: Daily Racing Form world. Composition **The Call** — one selected horse owns the fold; the rest of the program is a pickable strip; BACK THIS HORSE slip sits on the right. Approved comp: `.impeccable/mocks/landing-call.webp`. Comp-led.

Memorable moment: WARDEN (or the selected hero) at giant program-entry scale, Deposit as a green rubber stamp.

Constraints: non-custodial; do not invent volume/users/TVL/press; opponent is always BTC or ETH; create-bot lives on `/enter` (masthead Enter a horse). Copy through Paraglide.

Unresolved: live wallet adapter and contract addresses; empty roster when no heroes exist on-chain.

## Inventory (implementation)

| Region                                       | Medium                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| Newsprint ground (fiber, grain; ~full bleed) | Raster `static/landing/newsprint.webp` + CSS tile            |
| MARKETO / horse names / program numbers      | Self-hosted Big Shoulders Display (extra-condensed athletic) |
| Agate past-performance / labels              | Self-hosted Barlow Condensed                                 |
| BTC/ETH silks                                | CSS filled squares + type                                    |
| Horse+jockey mark                            | Authored SVG                                                 |
| Deposit stamp                                | Raster `static/landing/deposit-stamp.webp`, multiply blend   |
| Slip, inputs, program strip                  | Semantic HTML/CSS                                            |
| Hero portraits                               | Omitted — silks carry identity                               |
| Primary action                               | Stamp button in the slip                                     |

Sampled from approved comp / shipping sheet:

- Paper `#d4d4e8` (center) / `#f1f1fe` (hot sheet)
- Ink `#0b0b18`
- Purse/stamp mint `#006437`
- ETH silk `#6e6eed`
- BTC silk `#dc0b4a`

## Compositional commitments

- Nav: MARKETO, date, dreamDEX line, The program → `/program`, Enter a horse → `/enter`. No Markets/Vaults/Docs chrome. No on-page enter block.
- Headline scale: MARKETO masthead < selected horse name (the name is the display).
- Signature: thick ink rules, silks squares, stamp Deposit, cool venue-stock sheet.
- First viewport: masthead / call+slip / program strip.
