---
version: 1
slug: 'src-routes-program-page-svelte'
primary_target: 'src/routes/program/+page.svelte'
related_targets:
  [
    'src/routes/+page.svelte',
    'src/lib/landing/Masthead.svelte',
    'src/routes/form.css',
    'messages/en.json',
    'messages/id.json'
  ]
---

Visitor mode: Operate. Primary target: `src/routes/program/+page.svelte`.

Audience: a vault depositor who wants the full field, not only the in-form few on `/`.

Job: compare every horse with filters, open one, stamp a deposit. Proof is the tote (age, created, PnL, purse fill-to-max, active/scratched) and the overlay (PP, last backer, stamp). SYNTHETIC until chain data exists.

Direction: Daily Racing Form world. Composition **Tote overlay** — columns are the filters; a horse opens as a right-hand Hot Sheet. Approved comp: `.impeccable/mocks/decision/program-tote.webp`. Comp-led. Seed `951c01df`.

Memorable moment: opened horse at call-scale in the overlay, ruled purse bar filling toward max, Deposit stamp.

Constraints: overlay is `?horse=` on `/program`, not a second route. Deposit only on the overlay. Scratched and full-purse withhold the stamp. Homepage `/` stays The Call for in-form few. Copy through Paraglide. Do not ship invented payouts or strategy slogans from the decision comp.

Unresolved: live wallet adapter and contract addresses.

## Inventory (implementation)

| Region                                  | Medium                                                     |
| --------------------------------------- | ---------------------------------------------------------- |
| Newsprint ground                        | Raster `static/landing/newsprint.webp` + CSS tile          |
| MARKETO / horse names / program numbers | Self-hosted Big Shoulders Display                          |
| Agate tote / filters / last backer      | Self-hosted Barlow Condensed                               |
| BTC/ETH silks                           | CSS filled squares + type                                  |
| Purse fill-to-max                       | CSS ruled ink bar                                          |
| Deposit stamp                           | Raster `static/landing/deposit-stamp.webp`, multiply blend |
| Tote, chips, overlay                    | Semantic HTML/CSS                                          |

## Compositional commitments

- Nav: MARKETO, date, dreamDEX line, Enter a horse. No The program self-link. No Markets/Vaults/Docs chrome.
- First viewport: masthead / conditions chips / tote; overlay from the right when a horse is open.
- Signature: invert chips, 3px rules, silks, stamp Deposit, Hot Sheet overlay.
