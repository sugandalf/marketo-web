Visitor mode: Operate. Primary target: `src/routes/portfolio/+page.svelte`.

Audience: a connected wallet holder who already has positions — backer, owner, or both.

Job: move money. Read book PnL and capital at risk, open a backed horse, deposit more or redeem shares in one action. Owners watch vault PnL and cannot pull depositor funds. Proof is the tote of holdings plus the Hot Sheet slip. SYNTHETIC until chain data exists.

Direction: Daily Racing Form world. Composition **Book tote** — result line, BACKED/MINE/ALL chips, full-bleed tote; money moves on a 40% Hot Sheet, not the row. Approved comp: `.impeccable/mocks/decision/portfolio-tote.webp`. Comp-led. Seed `3226b2e6`.

Memorable moment: opened backed horse at call-scale, estimated shares, Deposit stamp and outlined Withdraw on the overlay.

Constraints: overlay is `?horse=` on `/portfolio`, not a second route. Deposit stamp stays the raster; Withdraw is scratched-style outline. One share-redeem (capital + PnL together). Copy through Paraglide. Do not ship invented overlay slogans or USDC from the decision comp. Losing PnL is Loss Crimson (`#84072c`), not Purse Green.

Unresolved: live wallet adapter, contract addresses, whether Withdraw ever gets its own stamp.

## Inventory (implementation)

Sampled from `.impeccable/mocks/decision/portfolio-tote.webp` (1536×1024). Grainy fields averaged on an interior patch. Established-world tokens win where the comp drifted (USDC, slogan type). Losing PnL uses BTC Ink crimson, not the mock's neon red fill.

| Region                           | Sampled / token                                | Medium                                               |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Page ground (newsprint multiply) | #d4d4e8 token                                      | Raster `static/landing/newsprint.webp` + CSS tile    |
| Hot Sheet overlay                | #f1f1fe                                        | CSS `--paper-hot` + newsprint                        |
| Ink                              | #0b0b18                                        | CSS                                                  |
| Purse / winning PnL              | #006437                                        | CSS `--money`                                        |
| Losing PnL                       | #84072c                                        | CSS `--loss` (`--btc-ink`)                           |
| BTC silks                        | #dc0b4a                                        | CSS filled square                                    |
| ETH silks                        | #6e6eed                                        | CSS filled square                                    |
| MARKETO / names / PnL figures    | Big Shoulders Display 800–900, extra-condensed | Self-hosted woff2                                    |
| Agate labels / tote / chips      | Barlow Condensed 400–700                       | Self-hosted woff2                                    |
| Corners / elevation              | 0 / none                                       | CSS                                                  |
| Rules                            | 3px ink; 1px 22% ink row hairlines             | CSS                                                  |
| Deposit stamp                    | existing green rubber stamp                    | Raster `static/landing/deposit-stamp.webp`, multiply |
| Withdraw                         | 1px ink outline, not filled, not green         | CSS                                                  |
| Ruled capital-vs-vault bar       | 1px ink track, ink fill                        | CSS                                                  |
| Tote, chips, overlay, amount     | semantic HTML/CSS                              | code                                                 |

## Compositional commitments

- Nav: MARKETO, date, dreamDEX line, EN/ID, The program, Enter a horse. Your book is current (no self-link).
- First viewport: masthead / result line YOUR BOOK + PnL + capital at risk / conditions / tote; overlay from the right when a holding is open.
- Signature: invert chips, 3px rules, silks, stamp Deposit, outlined Withdraw, Hot Sheet overlay.
- Do not literalize: “Guardian Protocol / Secure Yield”, dollar/USDC marks, a second filled stamp. Losing PnL is Loss Crimson, not the mock's neon red fill and not Purse Green.

## Open decisions (resolved for this build)

- Route: `/portfolio`.
- Withdraw: outlined, no stamp.
- Same horse as backer and owner: one row, both marks.
