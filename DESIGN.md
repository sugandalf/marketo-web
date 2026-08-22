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

Marketo reads as a Daily Racing Form card, not as a dark trading terminal. The sheet is ink on warm newsprint: extra-condensed athletic gothic for names and numbers, agate condensed for the small type that handicappers actually read, and thick rules that cut the page into a masthead, a call, a betting slip, and a program. Heroes are horses. BTC and ETH are silks. The vault is a purse. Deposit is a rubber stamp pressed into the slip.

The product commitment is an arena of heroes fighting a market. This world keeps that fight and casts it as a past-performance page you can study, back, or enter. A disconnected visitor stays a spectator of the card until they sign. Figures that are not on-chain wear an inverted SYNTHETIC stamp so the sheet never impersonates a live tote.

**Key Characteristics:**
- Warm newsprint ground, hue-less fiber tiled and multiplied into the sheet
- Big Shoulders Display for the call; Barlow Condensed for agate
- Square-cut everything; 3px carbon-ink rules between major regions
- Red BTC / blue ETH silks squares as identity, not portraits
- Purse green only for money in the black and for the Deposit stamp
- Invert-to-ink as the selected / pressed language

## Colors

A warm printed sheet: one carbon ink, two cream papers, one money green, and two silks. No candy pink, no cool gray, no crypto-orange, no night-mode navy.

### Primary
- **Carbon Ink**: The printed voice. Body type, rules, focus rings, scroll thumbs, inverted fills (active locale, chip hover, text selection), and the Connect / Open vault fill. If it would have been “UI chrome,” it is ink.

### Secondary
- **Purse Green**: Vault purses, estimated share percents, and winning PnL. The Deposit stamp prints in this ink. It is money on the card, not a general success color.

### Tertiary
- **BTC Silks**: Square field behind the letters BTC. Market identity for Bitcoin event horses.
- **ETH Silks**: Square field behind the letters ETH. Market identity for Ether event horses.

### Neutral
- **Sheet Stock**: Page ground and `html`/`body` fallback. Newsprint texture is gray fiber that multiplies onto this cream, not a second coat of pink.
- **Hot Sheet**: Lighter cream for inverted type (selection, active locale, silks letters, chip hover) and for the slip’s 55% wash. Use it as the “fresh impression” of the same paper, not as a second brand color.
- **Ink Wash**: 8% carbon over the sheet. Program-entry hover and selected state. Scrollbar tracks mix the same 8% ink into paper.

### Named Rules
**The Silks Rule.** BTC is always the red square; ETH is always the blue square. Silks are filled squares of extra-condensed market letters in Hot Sheet. They carry identity. Do not substitute coin logos, gradients, or circular avatars.

**The Purse-Green Rule.** Green is for vault figures, winning PnL, and the Deposit stamp. Losing PnL prints in Carbon Ink. Do not use green for “go,” links, or decorative fills.

## Typography

**Display Font:** Big Shoulders Display (Arial Narrow fallback), self-hosted woff2 at 700 / 800 / 900
**Body Font:** Barlow Condensed (Arial Narrow fallback), self-hosted woff2 at 400 / 600 / 700

**Character:** Athletic gothic poster type slammed against agate. Names and program numbers are extra-condensed, tight leading, slight negative tracking, always uppercase. The small type is a racing-form table: condensed, tracked labels, tabular figures.

### Hierarchy
- **Display** (900, clamp 4.2–6rem, line-height 0.76): Selected horse name. Program number beside it is the same family at 900, slightly larger clamp, line-height 0.75. This is the call, not the product wordmark.
- **Headline** (900, clamp 2.4–4.4rem, line-height 0.8): MARKETO masthead. It stays smaller than the selected horse. Slip titles and Enter headings sit in the same family at 800, 1.7–2.4rem.
- **Title** (800, ~1.6–1.7rem, line-height 0.85–0.9): Program-strip names, picked-horse line, enter-form values. Amount on the slip jumps to 2.6rem / 800 — a figure, not a heading.
- **Body** (400, 1.05rem, line-height 1.25): Markets line, slip lead, notes. Colophon is 1.15rem / 700. Agate measure is short (~42–46ch), not a novel column.
- **Label** (700, 0.8–0.95rem, letter-spacing 0.08–0.12em, uppercase): Dates, PP headers, purse captions, amount labels, chip text, Connect. Pedigree lines are 600 / 0.06em uppercase under the name — a racing line, not a heading.

Figures use `font-variant-numeric: tabular-nums`. Positive PnL prefixes `+`; losses do not invent a minus color.

### Named Rules
**The Call-is-Bigger Rule.** The selected horse name outranks MARKETO. Product chrome never out-shouts the horse you are looking at.

**The Agate Rule.** Past performances, chips, locale, and captions set in Barlow Condensed. Big Shoulders is for names, program numbers, purses, and keyed-in amounts only.

## Layout

The sheet is a full-viewport card (`min-height: 100dvh`) with three stacked bands: masthead, fold, program strip. Major bands and the Enter block divide with a 3px solid ink rule. Interior tables use 1px ink or 22% ink hairlines. Padding clusters around 0.85–1.25rem on the sheet edge; tight clusters inside a band use 0.2–0.55rem.

Masthead is three columns (mark / meta / actions), aligned to the baseline of the wordmark. The fold is a wide call beside a narrower slip. The program strip is equal columns of unselected horses. Below the card, a centered colophon and an Enter-a-horse block (steps | form) sit on the same sheet.

At `900px` every multi-column grid collapses to one column: the call rule moves from right to bottom, program entries stack with 1px ink underlines, the purse left-aligns and spans the call, and the card releases `100dvh`.

**The Ruled-Sheet Rule.** New regions join the card with a 3px ink rule, not a card-in-a-card, not a shadow, not extra outer margin. Hairlines are for rows inside a region.

## Elevation & Depth

The sheet is flat ink on paper. There are no box shadows. Depth is press, not lift: multiply-blended newsprint fiber (240×240px hue-less tile), a 55% Hot Sheet wash on the slip, 8% ink wash on a pressed program entry, and the Deposit stamp multiplied into the paper. Focus is a 2px ink outline with 3px offset. Text selection and the caret are ink.

### Shadow Vocabulary
None. `box-shadow` stays `none` on fields.

### Named Rules
**The Pressed-Ink Rule.** If something needs to sit “on” the sheet, multiply it or wash it. Do not raise it.

## Shapes

Every corner is a square cut (`border-radius: 0` on the sheet and all controls). Silks are squares, not circles. The slip title is a 3px ink rectangle around extra-condensed type. Amount and enter fields have no box: they are a 3px ink underline. Chips and Connect are sharp rectangles with 1–2px ink strokes. The only tilted, distressed rectangle is the Deposit rubber stamp itself.

**The Square-Cut Rule.** Radius is always 0. Pills, squircles, and rounded fields are off the card.

## Components

Tactile like a form you mark with a pencil, then stamp.

### Buttons
- **Shape:** Square-cut. No radius.
- **Primary (Connect / Open vault):** Carbon Ink fill, Hot Sheet type, 2px ink edge, 0.35rem 0.55rem, uppercase tracked label. No separate hover fill in the shipped sheet; keyboard focus uses the global 2px ink outline.
- **Chips (amount adders):** Transparent field, 1px ink stroke, 0.15rem 0.45rem. Hover inverts to ink fill / Hot Sheet type.
- **Ghost text (inactive locale, Enter link):** No box. Underline with 3px offset, or no underline when the horse mark carries the link.

### Chips
- **Style:** Amount chips as above. SYNTHETIC tags are not chips: they are tight inverted ink rectangles, 0.12em tracking, riding a caption.
- **State:** Chip hover = invert. Tag has no hover; it is a condition printed on the line.

### Cards / Containers
- **Corner Style:** Square cut
- **Background:** The page is the card (Sheet Stock + newsprint). The slip is the only inner wash (55% Hot Sheet).
- **Shadow Strategy:** None
- **Border:** 3px ink around slip titles and between bands; 1px dashed ink around the estimated-shares strip
- **Internal Padding:** ~1rem on the slip; ~0.7–0.9rem on program entries

### Inputs / Fields
- **Style:** Transparent, no box, 3px Carbon Ink underline. Amount uses Display-adjacent 2.6rem / 800 tabular figures; enter-form uses Title 1.6rem / 700. Number spinners are stripped.
- **Focus:** Global ink outline (2px / 3px offset), not a glow
- **Error / Disabled:** Notes under the field in body size; the sheet does not paint error red (red is BTC silks)

### Navigation
- **Style:** Masthead, not an app bar. MARKETO wordmark; weekday-long date + dreamDEX line; locale invert-buttons; Enter a horse with the authored horse-and-jockey mark (`currentColor` ink). No Markets / Vaults / Docs chrome on this sheet.
- **Locale:** Underlined until pressed; `aria-pressed="true"` fills ink and drops the underline.

### Market Silks
Square of BTC or ETH color; market letters in Hot Sheet, Big Shoulders 800. Call size 3.4rem; slip 2.1rem; program strip 2rem. Always the two-letter market, never an icon.

### Deposit Stamp
Primary deposit action is the rubber-stamp raster (`deposit-stamp.webp`) inside a borderless button, `mix-blend-mode: multiply`, max width 22rem. Hover/focus adds `contrast(1.12) brightness(0.96)` over 160ms (`cubic-bezier(0.16, 1, 0.3, 1)`); reduced motion kills the transition. Do not replace this with a filled Primary button. Connect-wallet remains the ink rectangle because it is a wallet gate, not the bet.

### Program Entry
Full-width button, four-column inner grid (number, silks, name+agate PP, purse). 1px ink at the right (bottom at 900px). Hover and `aria-pressed="true"` take the 8% ink wash. Entry names are Title; numbers are Display-family 2rem / 900.

### Past-Performance Rows
Five agate columns (date, window, vs-market, side, PnL). Tabular numbers. 1px 22% ink hairline under each row. Header is uppercase 0.85rem with a 1px solid ink underline.

## Do's and Don'ts

### Do:
- **Do** ground new surfaces on Sheet Stock with the newsprint tile at 240px, `background-blend-mode: multiply`.
- **Do** cut regions with 3px Carbon Ink rules and keep every radius at 0.
- **Do** identify a market with silks squares (BTC red, ETH blue) and extra-condensed letters.
- **Do** print purses and winning PnL in Purse Green; print losses in Carbon Ink.
- **Do** set horse names and program numbers in Big Shoulders Display 800–900; set tables, labels, and notes in Barlow Condensed.
- **Do** invert to ink-on-Hot-Sheet for selection, chip hover, and active locale.
- **Do** stamp Deposit; fill Connect.
- **Do** mark non-chain figures with the inverted SYNTHETIC tag.

### Don't:
- **Don't** ship a dark DeFi hero with three equal feature cards.
- **Don't** round corners, raise shadows, or frost glass over the sheet.
- **Don't** give heroes photographic portraits or coin-logo avatars; silks carry identity.
- **Don't** recast BTC as orange or ETH as purple; those silks are locked.
- **Don't** use Purse Green for losses, links, or large fills that are not money or the stamp.
- **Don't** let MARKETO or UI labels out-size the selected horse name on a call surface.
- **Don't** swap the Deposit stamp for a gradient CTA or a second ink-fill button.
- **Don't** substitute Inter, system UI, or a serif editorial face for the athletic gothic / agate pairing.
