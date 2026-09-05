---
version: 1
slug: "src-routes-enter-page-svelte"
primary_target: "src/routes/enter/+page.svelte"
related_targets: ["src/routes/+page.svelte","src/routes/form.css","messages/en.json","messages/id.json","static/landing/open-vault-stamp.webp"]
---

# Enter a horse — Condition-book spread

Visitor mode: Operate. Primary target: `src/routes/enter/+page.svelte`.

Audience: a visitor who wants to become a named horse — from the racing-card masthead or this URL. Depositors stay on the card.

Job: file entry papers and open a vault others can back. Proof is the nomination (name, silks, strategy, purse), labeled SYNTHETIC until chain data exists.

Direction: Daily Racing Form world. Composition **Condition-book spread** — left: what entering is (three facts + miniature sample that becomes the typed horse, including vault purse and 5× max TVL as opening purse writes); right: ENTRY PAPERS; Open vault stamp at the foot of the papers. Approved comp: `.impeccable/mocks/decision/enter-condition.webp`. Comp-led. Seed aa1ff93c.

Memorable moment: the two-page sheet; stamping gathers the papers into a receipt, then an explicit control to see the horse on the card.

Constraints: non-custodial; user signs; silks locked to BTC cherry / ETH periwinkle; square-cut; Paraglide copy; no invented legal/volume/press. Homepage enter block removed; masthead Enter a horse links here.

Unresolved: live wallet adapter; contract addresses; how an other-address bot wallet maps on-chain.

## Inventory (implementation)

| Region                                  | Medium                                                        |
| --------------------------------------- | ------------------------------------------------------------- |
| Newsprint ground                        | Raster `static/landing/newsprint.webp` + CSS tile             |
| MARKETO / horse names / program numbers | Self-hosted Big Shoulders Display                             |
| Agate facts / labels                    | Self-hosted Barlow Condensed                                  |
| BTC/ETH silks                           | CSS filled squares + type                                     |
| Horse+jockey mark (home link)           | Authored SVG                                                  |
| Open vault stamp                        | Raster `static/landing/open-vault-stamp.webp`, multiply blend |
| Papers, underlines, chips               | Semantic HTML/CSS                                             |
| Miniature sample                        | Same call grammar as landing, live-bound to the form; purse + ruled 5× max |

Sampled (DESIGN.md / landing sheet, not muddy comp averages):

- Paper `#d4d4e8` / hot sheet `#f1f1fe`
- Ink `#0b0b18`
- Purse/stamp mint `#006437`
- BTC `#dc0b4a` / ETH `#6e6eed`

## Compositional commitments

- Nav: MARKETO (home), date, dreamDEX line, locale. No Enter self-link. No Markets/Vaults/Docs.
- Spread: facts ~40% left, papers ~60% right; 3px ink gutter. Stack at 900px, facts above papers.
- Signature: 3px rules, silks squares as market chips, stamp Open vault, newsprint sheet.
- Confirmation: same sheet; right page becomes receipt + see-on-card control.
- Miniature max TVL is 5× the opening purse and writes as the purse field changes; hidden at 0.
