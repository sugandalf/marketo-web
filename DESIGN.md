---
name: Marketo
description: Warm newsprint racing form for backing heroes on dreamDEX event markets.
colors:
  ink: "#040303"
  paper: "#e6d8c6"
  paper-hot: "#f3eadc"
  money: "#085324"
  btc: "#e42c22"
  eth: "#0756d0"
  ink-wash: "color-mix(in srgb, #040303 8%, transparent)"
typography:
  display:
    fontFamily: "'Big Shoulders Display', 'Arial Narrow', sans-serif"
    fontSize: "clamp(4.2rem, 11vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.76
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Big Shoulders Display', 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 4.4rem)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Big Shoulders Display', 'Arial Narrow', sans-serif"
    fontSize: "1.7rem"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  label:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.1em"
rounded:
  cut: "0px"
spacing:
  hair: "0.2rem"
  xs: "0.35rem"
  sm: "0.55rem"
  md: "0.85rem"
  lg: "1.25rem"
  xl: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-hot}"
    typography: "{typography.label}"
    rounded: "{rounded.cut}"
    padding: "0.35rem 0.55rem"
  button-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.cut}"
    padding: "0.15rem 0.45rem"
  button-chip-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    padding: "0.15rem 0.45rem"
  button-chip-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    padding: "0.15rem 0.45rem"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.cut}"
    padding: "0.2rem 0"
  silks-btc:
    backgroundColor: "{colors.btc}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    size: "3.4rem"
  silks-eth:
    backgroundColor: "{colors.eth}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    size: "3.4rem"
  silks-pick:
    backgroundColor: "{colors.btc}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    size: "4.2rem"
  tag-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    padding: "0 0.28rem"
  locale-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-hot}"
    rounded: "{rounded.cut}"
    padding: "0.15rem 0.2rem"
  slip:
    backgroundColor: "color-mix(in srgb, #f3eadc 55%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.cut}"
    padding: "1rem 1.1rem 1.2rem"
  papers:
    backgroundColor: "color-mix(in srgb, #f3eadc 55%, transparent)"
    textColor: "{colors.ink}"
    rounded: "{rounded.cut}"
    padding: "1.1rem 1.25rem 1.5rem"
  program-entry:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.cut}"
    padding: "0.7rem 0.9rem"
  program-entry-hover:
    backgroundColor: "{colors.ink-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cut}"
    padding: "0.7rem 0.9rem"
---

# Design System: Marketo

## Overview

**Creative North Star: "The Past-Performance Sheet"**

Marketo reads as a Daily Racing Form card, not as a dark trading terminal. The sheet is ink on warm newsprint: extra-condensed athletic gothic for names and numbers, agate condensed for the small type that handicappers actually read, and thick rules that cut the page into bands. Heroes are horses. BTC and ETH are silks. The vault is a purse. Deposit and Open vault are rubber stamps pressed into the paper.

Two surfaces share that world. `/` is the racing card: masthead, a selected call beside a betting slip, a program strip of the rest. `/enter` is the same stock opened as a two-page condition book: facts left, papers right. Entering is not a wizard, not a settings form, and not a block on the racing card — the masthead’s Enter a horse mark is the door.

The product commitment is an arena of heroes fighting a market. This world keeps that fight and casts it as a past-performance page you can study, back, or enter. A disconnected visitor stays a spectator until they sign. Figures that are not on-chain wear an inverted SYNTHETIC stamp so the sheet never impersonates a live tote.

**Key Characteristics:**
- Warm newsprint ground, hue-less fiber tiled and multiplied into the sheet
- Big Shoulders Display for the call; Barlow Condensed for agate
- Square-cut everything; 3px carbon-ink rules between major regions
- Red BTC / blue ETH silks squares as identity, not portraits
- Purse green only for money in the black and for the Deposit / Open-vault stamps
- Invert-to-ink as the selected / pressed language
- `/enter` is a condition-book spread (facts | papers), not a stepper

## Colors

A warm printed sheet: one carbon ink, two cream papers, one money green, and two silks. No candy pink, no cool gray, no crypto-orange, no night-mode navy.

### Primary
- **Carbon Ink**: The printed voice. Body type, rules, focus rings, scroll thumbs, inverted fills (active locale, chip hover and checked, fact numbers, text selection), and the Connect fill. If it would have been “UI chrome,” it is ink.

### Secondary
- **Purse Green**: Vault purses, estimated share percents, and winning PnL. The Deposit and Open-vault stamps print in this ink. It is money on the card, not a general success color.

### Tertiary
- **BTC Silks**: Square field behind the letters BTC. Market identity for Bitcoin event horses.
- **ETH Silks**: Square field behind the letters ETH. Market identity for Ether event horses.

### Neutral
- **Sheet Stock**: Page ground and `html`/`body` fallback. Newsprint texture is gray fiber that multiplies onto this cream, not a second coat of pink.
- **Hot Sheet**: Lighter cream for inverted type (selection, active locale, silks letters, chip hover) and for the 55% wash on the slip and on `/enter` papers. Use it as the “fresh impression” of the same paper, not as a second brand color.
- **Ink Wash**: 8% carbon over the sheet. Program-entry hover and selected state. Scrollbar tracks mix the same 8% ink into paper.

### Named Rules
**The Silks Rule.** BTC is always the red square; ETH is always the blue square. Silks are filled squares of extra-condensed market letters in Hot Sheet. They carry identity. Do not substitute coin logos, gradients, or circular avatars.

**The Purse-Green Rule.** Green is for vault figures, winning PnL, and the Deposit / Open-vault stamps. Losing PnL prints in Carbon Ink. Do not use green for “go,” links, or decorative fills.

## Typography

**Display Font:** Big Shoulders Display (Arial Narrow fallback), self-hosted woff2 at 700 / 800 / 900
**Body Font:** Barlow Condensed (Arial Narrow fallback), self-hosted woff2 at 400 / 600 / 700

**Character:** Athletic gothic poster type slammed against agate. Names and program numbers are extra-condensed, tight leading, slight negative tracking, always uppercase. The small type is a racing-form table: condensed, tracked labels, tabular figures.

### Hierarchy
- **Display** (900, clamp 4.2–6rem, line-height 0.76): Selected horse name on the racing card. Program number beside it is the same family at 900, slightly larger clamp, line-height 0.75. This is the call, not the product wordmark. The `/enter` miniature scales the same grammar down (name clamp 1.8–2.8rem; number 3.2rem).
- **Headline** (900, clamp 2.4–4.4rem, line-height 0.8): MARKETO masthead. It stays smaller than the selected horse on a call surface. Facts-page title on `/enter` is the same family at 800, clamp 2.2–3.2rem, line-height 0.85.
- **Title** (800, 1.7rem, line-height 0.85–1): Boxed slip / papers titles (3px ink rectangle, 0.04em tracking, centered). Program-strip names, picked-horse line, papers field values at 1.6rem / 700. Amount on the slip jumps to 2.6rem / 800 — a figure, not a heading. Receipt “see this horse” is Title-adjacent 1.6rem / 800.
- **Body** (400, 1.05rem, line-height 1.25): Markets line, slip lead, facts notes. Colophon is 1.15rem / 700. Agate measure is short (~42–46ch), not a novel column. Field notes and form notes sit at 0.92rem.
- **Label** (700, 0.8–0.95rem, letter-spacing 0.08–0.12em, uppercase): Dates, PP headers, purse captions, amount labels, chip text, Connect, papers legends. Pedigree lines are 600 / 0.06em uppercase under the name — a racing line, not a heading. Fact rows on `/enter` are 700 / 0.04em uppercase with inverted program numerals.

Figures use `font-variant-numeric: tabular-nums`. Positive PnL prefixes `+`; losses do not invent a minus color. Placeholders mix 72% ink into Sheet Stock.

### Named Rules
**The Call-is-Bigger Rule.** On a call surface, the selected horse name outranks MARKETO. Product chrome never out-shouts the horse you are looking at. The `/enter` miniature is a preview, not a second call.

**The Agate Rule.** Past performances, chips, locale, facts copy, and captions set in Barlow Condensed. Big Shoulders is for names, program numbers, purses, boxed titles, and keyed-in amounts only.

## Layout

The sheet is a full-viewport card (`min-height: 100dvh`). The racing card has three stacked bands: masthead, fold, program strip, then a centered colophon. `/enter` has two: masthead, then the book. Interior tables use 1px ink or 22% ink hairlines. Padding clusters around 0.85–1.25rem on the sheet edge; tight clusters inside a band use 0.2–0.55rem.

Masthead is three columns (mark / meta / actions), aligned to the baseline of the wordmark. On the racing card, the fold is a wide call beside a narrower slip (`1.7fr | 0.72fr`); the program strip is equal columns of unselected horses. Enter-a-horse is not on this sheet: the masthead links to `/enter` with the authored horse-and-jockey mark. No Enter self-link on `/enter`.

On `/enter`, the book is two pages (`0.82fr | 1.18fr`) divided by a 3px ink rule. Left: What entering is — numbered facts 01–03 as inverted 2.1rem ink squares, then a miniature call that writes as the papers fill, boxed in 1px ink. Right: Entry papers on a 55% Hot Sheet wash — name, silks, strategy, wallet, opening purse — with How it works (in-page) and the Open vault stamp at the foot. After a successful stamp, the right page becomes a receipt plus See this horse on the card. There is no colophon on `/enter`.

At `900px` every multi-column grid collapses to one column: the call or facts rule moves from right to bottom, program entries stack with 1px ink underlines, the purse left-aligns and spans the call, papers-foot stacks stamp above the how-link, and the card releases `100dvh`.

**The Ruled-Sheet Rule.** New regions join the card with a 3px ink rule, not a card-in-a-card, not a shadow, not extra outer margin. Hairlines are for rows inside a region.

**The Two-Page Rule.** Entering is facts left, papers right. Do not recast `/enter` as a wizard, a stepper, a modal, or a settings panel, and do not put the nomination form back on the racing card.

## Elevation & Depth

The sheet is flat ink on paper. There are no box shadows. Depth is press, not lift: multiply-blended newsprint fiber (240×240px hue-less tile), a 55% Hot Sheet wash on the slip and on `/enter` papers, 8% ink wash on a pressed program entry, and the Deposit / Open-vault stamps multiplied into the paper. Focus is a 2px ink outline with 3px offset. Text selection and the caret are ink.

### Shadow Vocabulary
None. `box-shadow` stays `none` on fields.

### Named Rules
**The Pressed-Ink Rule.** If something needs to sit “on” the sheet, multiply it or wash it. Do not raise it.

## Shapes

Every corner is a square cut (`border-radius: 0` on the sheet and all controls). Silks are squares, not circles. Slip and papers titles are a 3px ink rectangle around extra-condensed type. Amount and papers fields have no box: they are a 3px ink underline. Chips and Connect are sharp rectangles with 1–2px ink strokes. Selected silks on papers take a 3px ink edge and a filled ink triangle at the top-right — a corner tick, not a check glyph. The only tilted, distressed rectangles are the Deposit and Open-vault rubber stamps.

**The Square-Cut Rule.** Radius is always 0. Pills, squircles, and rounded fields are off the card.

## Components

Tactile like a form you mark with a pencil, then stamp.

### Buttons
- **Shape:** Square-cut. No radius.
- **Primary (Connect):** Carbon Ink fill, Hot Sheet type, 2px ink edge, 0.35rem 0.55rem, uppercase tracked label. Wallet gate only — on the slip after Deposit intent, on `/enter` after Open vault if the wallet is still demo-disconnected. No separate hover fill in the shipped sheet; keyboard focus uses the global 2px ink outline. Never the nomination or the bet.
- **Chips (amount adders, wallet same/other):** Transparent field, 1px ink stroke, 0.15rem 0.45rem. Hover and `aria-checked="true"` invert to ink fill / Hot Sheet type.
- **Ghost text (inactive locale, How it works, Enter link):** No box. Underline with 3px offset. The horse mark carries the home Enter link; MARKETO is an undecorated home link.

### Chips
- **Style:** Amount and wallet chips as above. SYNTHETIC tags are not chips: they are tight inverted ink rectangles, 0.12em tracking, riding a caption.
- **State:** Chip hover and checked = invert. Tag has no hover; it is a condition printed on the line.

### Cards / Containers
- **Corner Style:** Square cut
- **Background:** The page is the card (Sheet Stock + newsprint). Inner wash (55% Hot Sheet) on the slip and on `/enter` papers. The miniature is Sheet Stock inside a 1px ink box, not a second wash.
- **Shadow Strategy:** None
- **Border:** 3px ink around slip / papers titles and between bands; 1px dashed ink around the estimated-shares strip; 1px solid ink around the miniature
- **Internal Padding:** ~1rem on the slip; 1.1–1.25rem on papers; ~0.7–0.9rem on program entries and the miniature

### Inputs / Fields
- **Style:** Transparent, no box, 3px Carbon Ink underline. Amount uses Display-adjacent 2.6rem / 800 tabular figures; papers fields use 1.6rem / 700. Number spinners are stripped. Character counts sit at the end of the field in 400 / 0.06em.
- **Focus:** Global ink outline (2px / 3px offset), not a glow
- **Error / Disabled:** Notes under the field in 0.92rem agate; the sheet does not paint error red (red is BTC silks)

### Navigation
- **Style:** Masthead, not an app bar. MARKETO wordmark (links home); weekday-long date + dreamDEX line; locale invert-buttons; on the racing card, Enter a horse with the authored horse-and-jockey mark (`currentColor` ink) to `/enter`. No Enter self-link on `/enter`. No Markets / Vaults / Docs chrome.
- **Locale:** Underlined until pressed; `aria-pressed="true"` fills ink and drops the underline.

### Market Silks
Square of BTC or ETH color; market letters in Hot Sheet, Big Shoulders 800. Call size 3.4rem; slip 2.1rem; program strip 2rem; miniature / receipt 2.6rem; papers pick 4.2rem. Always the two-letter market, never an icon. On `/enter`, the selected pick carries a 3px ink border and a black corner tick (ink triangle at the top-right). Unselected picks have a transparent 3px edge so the squares do not jump.

### Numbered Facts
The 01–03 list on the left page. Each index is a 2.1rem inverted ink square, Big Shoulders 800 / 1.15rem, Hot Sheet numerals. The row is uppercase agate. These are printed program numerals, not kickers and not interactive chips.

### Miniature Call
Live preview on the facts page: program number, silks, name, pedigree, empty PP with SYNTHETIC, purse in Purse Green. It writes as the papers fill (name, silks, strategy, purse). Same call grammar as the racing card, scaled to sit inside a 1px ink box.

### Deposit Stamp
Primary deposit action is the rubber-stamp raster (`deposit-stamp.webp`) inside a borderless button, `mix-blend-mode: multiply`, max width 22rem. Hover/focus adds `contrast(1.12) brightness(0.96)` over 160ms (`cubic-bezier(0.16, 1, 0.3, 1)`); reduced motion kills the transition. Do not replace this with a filled Primary button. Connect-wallet remains the ink rectangle because it is a wallet gate, not the bet.

### Open Vault Stamp
On `/enter`, the nomination action is the matching rubber-stamp raster (`open-vault-stamp.webp`): OPEN VAULT / YOU STILL SIGN, same multiply blend and hover. Foot of the papers: max width 18rem, right-aligned beside How it works; at 900px it centers at 22rem above the link. Do not replace it with the Connect ink-fill.

### Program Entry
Full-width button, four-column inner grid (number, silks, name+agate PP, purse). 1px ink at the right (bottom at 900px). Hover and `aria-pressed="true"` take the 8% ink wash. Entry names are Title; numbers are Display-family 2rem / 900.

### Past-Performance Rows
Five agate columns (date, window, vs-market, side, PnL). Tabular numbers. 1px 22% ink hairline under each row. Header is uppercase 0.85rem with a 1px solid ink underline.

### Receipt
After a successful Open vault, the papers page keeps the Hot Sheet wash and boxed title, then a picked-horse line, purse, wallet message, and See this horse on the card (Title link with 3px underline offset). Same sheet; no modal, no toast.

## Do's and Don'ts

### Do:
- **Do** ground new surfaces on Sheet Stock with the newsprint tile at 240px, `background-blend-mode: multiply`.
- **Do** cut regions with 3px Carbon Ink rules and keep every radius at 0.
- **Do** identify a market with silks squares (BTC red, ETH blue) and extra-condensed letters.
- **Do** mark the selected silks pick with a 3px ink edge and a top-right corner tick.
- **Do** print purses and winning PnL in Purse Green; print losses in Carbon Ink.
- **Do** set horse names and program numbers in Big Shoulders Display 800–900; set tables, labels, and notes in Barlow Condensed.
- **Do** invert to ink-on-Hot-Sheet for selection, chip hover/checked, active locale, and fact numerals.
- **Do** stamp Deposit and Open vault; fill Connect.
- **Do** wash the slip and the papers at 55% Hot Sheet.
- **Do** mark non-chain figures with the inverted SYNTHETIC tag.

### Don't:
- **Don't** ship a dark DeFi hero with three equal feature cards.
- **Don't** round corners, raise shadows, or frost glass over the sheet.
- **Don't** give heroes photographic portraits or coin-logo avatars; silks carry identity.
- **Don't** recast BTC as orange or ETH as purple; those silks are locked.
- **Don't** use Purse Green for losses, links, or large fills that are not money or the stamp.
- **Don't** let MARKETO or UI labels out-size the selected horse name on a call surface.
- **Don't** swap the Deposit or Open-vault stamp for a gradient CTA or a second ink-fill button.
- **Don't** recast `/enter` as a wizard, stepper, or settings form, or put nomination fields back on the racing card.
- **Don't** replace the silks corner tick with a check glyph or a circular radio.
- **Don't** substitute Inter, system UI, or a serif editorial face for the athletic gothic / agate pairing.
