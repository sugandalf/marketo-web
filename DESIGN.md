---
name: Marketo
description: Cool venue-stock racing form for backing heroes on dreamDEX event markets.
colors:
  ink: '#0b0b18'
  paper: '#d4d4e8'
  paper-hot: '#f1f1fe'
  money: '#006437'
  loss: '#84072c'
  btc: '#dc0b4a'
  eth: '#6e6eed'
  btc-ink: '#84072c'
  eth-ink: '#2c2c5f'
  wash-btc: 'oklch(0.87 0.02 15)'
  wash-eth: 'oklch(0.87 0.02 290)'
  wash-btc-hot: 'oklch(0.94 0.016 15)'
  wash-eth-hot: 'oklch(0.94 0.016 290)'
  ink-wash: 'color-mix(in srgb, #0b0b18 8%, transparent)'
typography:
  display:
    fontFamily: "'Big Shoulders Display', 'Arial Narrow', sans-serif"
    fontSize: 'clamp(4.2rem, 11vw, 6rem)'
    fontWeight: 900
    lineHeight: 0.76
    letterSpacing: '-0.03em'
  headline:
    fontFamily: "'Big Shoulders Display', 'Arial Narrow', sans-serif"
    fontSize: 'clamp(2.4rem, 5vw, 4.4rem)'
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: '-0.035em'
  title:
    fontFamily: "'Big Shoulders Display', 'Arial Narrow', sans-serif"
    fontSize: '1.7rem'
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: '-0.02em'
  body:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: '1.05rem'
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 'normal'
  label:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"
    fontSize: '0.8rem'
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: '0.1em'
rounded:
  cut: '0px'
spacing:
  hair: '0.2rem'
  xs: '0.35rem'
  sm: '0.55rem'
  md: '0.85rem'
  lg: '1.25rem'
  xl: '1.5rem'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    typography: '{typography.label}'
    rounded: '{rounded.cut}'
    padding: '0.35rem 0.55rem'
  button-chip:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.15rem 0.45rem'
  button-chip-hover:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    padding: '0.15rem 0.45rem'
  button-chip-checked:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    padding: '0.15rem 0.45rem'
  button-withdraw:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.cut}'
    padding: '0.45rem 0.65rem'
    width: '22rem'
  book-title:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.22rem 0.45rem'
  input-underline:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.title}'
    rounded: '{rounded.cut}'
    padding: '0.2rem 0'
  silks-btc:
    backgroundColor: '{colors.btc}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    size: '3.4rem'
  silks-eth:
    backgroundColor: '{colors.eth}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    size: '3.4rem'
  silks-pick:
    backgroundColor: '{colors.btc}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    size: '4.2rem'
  tag-ink:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    padding: '0 0.28rem'
  locale-active:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    padding: '0.15rem 0.2rem'
  account-chip:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.2rem 0.45rem'
  account-chip-open:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    padding: '0.2rem 0.45rem'
  account-slip:
    backgroundColor: '{colors.paper-hot}'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.45rem'
    width: '14rem'
  slip:
    backgroundColor: 'color-mix(in srgb, #f1f1fe 55%, transparent)'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '1rem 1.1rem 1.2rem'
  papers:
    backgroundColor: 'color-mix(in srgb, #f1f1fe 55%, transparent)'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '1.1rem 1.25rem 1.5rem'
  program-entry:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.7rem 0.9rem'
  program-entry-hover:
    backgroundColor: '{colors.ink-wash}'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.7rem 0.9rem'
  tote-row:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.55rem 1.25rem'
  tote-row-hover:
    backgroundColor: '{colors.ink-wash}'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.55rem 1.25rem'
  sheet-overlay:
    backgroundColor: '{colors.paper-hot}'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '1rem 1.1rem 1.4rem'
    width: '40%'
  status-active:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper-hot}'
    rounded: '{rounded.cut}'
    padding: '0.1rem 0.35rem'
  status-scratched:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    padding: '0.1rem 0.35rem'
  tvl-track:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.cut}'
    height: '0.55rem'
---

# Design System: Marketo

## Overview

**Creative North Star: "The Past-Performance Sheet"**

Marketo reads as a Daily Racing Form card, not as a dark trading terminal. The sheet is ink on cool venue stock — dreamDEX’s periwinkle-tinted paper, not cream newsprint and not a night-mode invert: extra-condensed athletic gothic for names and numbers, agate condensed for the small type that handicappers actually read, and thick rules that cut the page into bands. Heroes are horses. BTC and ETH are silks. The vault is a purse. Deposit and Open vault are rubber stamps pressed into the paper. Withdraw is a 1px ink outline on the same sheet, never a second stamp. Persistent session is an ink-fill Connect last in the masthead, then an outline truncated-address chip that opens a Hot Sheet slip — never a hero CTA and never a modal.

Four surfaces share that world. `/` is the racing card: masthead, a selected call beside a betting slip, a program strip of the rest. `/program` is the overnight tote of every horse, with a right-hand Hot Sheet overlay to back one. `/enter` is the same stock opened as a two-page condition book: facts left, papers right. `/portfolio` is the connected wallet’s book: a tote of horses already held, with the same right Hot Sheet to stamp more or redeem shares. Entering is not a wizard, not a settings form, and not a block on the racing card — the masthead’s Enter a horse mark is the door. The program is the masthead’s The program mark. The book is the masthead’s Your book mark.

The product commitment is an arena of heroes fighting a market. This world keeps that fight and casts it as a past-performance page you can study, back, or enter. A disconnected visitor stays a spectator until they sign. The same Wagmi session (injected / EIP-6963) unlocks stamp-time Connect gates. The sheet never names a chain. Figures that are not on-chain wear an inverted SYNTHETIC stamp so the sheet never impersonates a live tote. Owner-only rows on the book are watch-only: vault PnL prints; depositor funds cannot be pulled.

**Key Characteristics:**

- Cool lavender sheet ground, hue-less fiber tiled and multiplied into the stock
- Big Shoulders Display for the call; Barlow Condensed for agate
- Square-cut everything; 3px carbon-ink rules between major regions
- Cherry BTC / periwinkle ETH silks squares as identity, not portraits
- Mint purse green only for money in the black and for the Deposit / Open-vault stamps; losing PnL prints in BTC-ink crimson
- Invert-to-ink as the selected / pressed language
- `/enter` is a condition-book spread (facts | papers), not a stepper
- `/program` is a tote of every horse with a right Hot Sheet overlay, not a second horse route
- `/portfolio` is a tote of horses already held with the same overlay, not a dashboard of position cards
- Persistent session last in masthead-actions: ink-fill Connect, outline address chip, Hot Sheet account slip

## Colors

A cool printed sheet mapped from [dreamDEX](https://www.dreamdex.io/): one press ink, two lavender papers, one mint purse, and two silks — plus two silks-inks derived for type on paper. No cream newsprint, no night-mode invert, no crypto-orange.

### Primary

- **Carbon Ink**: DreamDEX blue-1000 `#0b0b18`. The printed voice. Body type, rules, focus rings, scroll thumbs, inverted fills (active locale, chip hover and checked, account chip open, fact numbers, text selection), the Connect fill, the tote fill-to-max bar, and the Active status tag. If it would have been “UI chrome,” it is ink. Book-bar capital at risk prints in this ink. The Withdraw outline is this ink, 1px. The account slip’s box is this ink, 2px. It is not the periwinkle action fill; that hue belongs to ETH silks.

### Secondary

- **Purse Green**: DreamDEX mint-800 `#006437`. Vault purses, estimated share percents, and winning PnL (5.0:1 on Sheet Stock). The Deposit and Open-vault stamps print in this family (raster `#085324`, mint-adjacent). It is money on the card, not a general success color. It does not fill the purse track. It does not fill Withdraw. Neon mint `#00fa89` is not body type.

- **Loss Crimson**: BTC Ink `#84072c` (7.0:1 on Sheet Stock). Losing PnL only. Same type-safe cherry as “vs BTC,” not the silks fill `#dc0b4a` and not Carbon Ink. Flat zero stays Purse Green with no `+`.

### Tertiary

- **BTC Silks**: DreamDEX cherry `#dc0b4a`. Square field behind the letters BTC. Market identity for Bitcoin event horses. Fill only — not body type on paper (3.6:1). Letters on the square are Hot Sheet (4.5:1).
- **ETH Silks**: DreamDEX brand periwinkle `#6e6eed`. Square field behind the letters ETH. Market identity for Ether event horses. Fill only — not body type on paper (2.9:1). Letters on the square are Hot Sheet (3.7:1, large).
- **BTC Ink**: Cherry-700 `#84072c` for “vs BTC” on paper (7.0:1). Same hue family as the square; dark enough to read.
- **ETH Ink**: Brand blue-800 `#2c2c5f` for “vs ETH” on paper (8.8:1). Same hue family as the square.

### Neutral

- **Sheet Stock**: Page ground and `html`/`body` fallback `#d4d4e8`. Cooler and a step darker than the old cream. Newsprint texture is gray fiber that multiplies onto this lavender stock, not a second coat of pink. At `900px` the `/program` and `/portfolio` overlays and their sticky stamp feet print on this same stock, because they are the page.
- **Hot Sheet**: DreamDEX blue-50 `#f1f1fe`. Lighter cool stock for inverted type (selection, active locale, silks letters, chip hover, open account chip) and for the 55% wash on the slip and on `/enter` papers. The `/program` and `/portfolio` overlays are a full Hot Sheet (not a 55% wash) with the same newsprint multiply. The account slip is that same full Hot Sheet in miniature. Use it as the “fresh impression” of the same paper, not as a second brand color.
- **Ink Wash**: 8% press ink over the sheet. Program-entry hover, tote-row hover and selected, Withdraw hover, and the pressed tote row. Scrollbar tracks mix the same 8% ink into paper.
- **Silks Wash**: Paper-lightness OKLCH in the BTC (hue 15, cherry) or ETH (hue 290, periwinkle) silks, chroma held to ~0.02 so the cool sheet stays one stock. Stains the open horse’s call, slip, overlay, and `/enter` papers. Hot variants for Hot Sheet regions. Not a mix of the neon fill into stock.

### Named Rules

**The Silks Rule.** BTC is always the cherry square; ETH is always the periwinkle square. Silks are filled squares of extra-condensed market letters in Hot Sheet. They carry identity. Do not substitute coin logos, gradients, or circular avatars.

**The Silks-in-the-Agate Rule.** Opponent market in past performances prints in silks-ink with a 0.5rem silks square so color is not the only code. Compact program-strip lines color the vs text only. Do not set body type in the fill hues.

**The Stained-Impression Rule.** The open horse stains its impression with a wash mixed at paper lightness in the silks hue (not a mix of the neon fill into stock). Call and slip take a translucent wash so newsprint shows; `/program` and `/portfolio` overlays (and the sticky foot at `900px`) take the opaque hot or sheet wash. `/enter` papers take the hot wash of the picked silks. The tote does not stripe. The miniature stays Sheet Stock. Chrome stays carbon.

**The Purse-Green Rule.** Green is for vault figures, winning PnL, and the Deposit / Open-vault stamps. Losing PnL prints in Loss Crimson (`--loss` / BTC Ink). Do not use green for losses, “go,” links, decorative fills, or the purse fill-to-max bar.

## Typography

**Display Font:** Big Shoulders Display (Arial Narrow fallback), self-hosted woff2 at 700 / 800 / 900
**Body Font:** Barlow Condensed (Arial Narrow fallback), self-hosted woff2 at 400 / 600 / 700

**Character:** Athletic gothic poster type slammed against agate. Names and program numbers are extra-condensed, tight leading, slight negative tracking, always uppercase. The small type is a racing-form table: condensed, tracked labels, tabular figures.

### Hierarchy

- **Display** (900, clamp 4.2–6rem, line-height 0.76): Selected horse name on the racing card only. Program number beside it is the same family at 900, slightly larger clamp (5–6rem), line-height 0.75. This is the call, not the product wordmark. The `/program` and `/portfolio` overlays keep a compact call so the stamp stays in the first view: number clamp 2–2.6rem, name clamp 1.8–2.4rem, 2.4rem silks, one row. At `900px` the overlay name is 2.2rem and the number 2.4rem. The `/enter` miniature scales the same grammar down (name clamp 1.8–2.8rem; number 3.2rem).
- **Headline** (900, clamp 2.4–4.4rem, line-height 0.8): MARKETO masthead. It stays smaller than the selected horse on a call surface. Facts-page title on `/enter` is the same family at 800, clamp 2.2–3.2rem, line-height 0.85.
- **Title** (800, 1.7rem, line-height 0.85–1): Boxed slip / papers titles (3px ink rectangle, 0.04em tracking, centered). Program-strip names, picked-horse line, papers field values at 1.6rem / 700. Tote names are denser Title: 1.55rem / 800. Tote program numbers are 1.7rem / 900. Overlay horse name is Title-plus: clamp 1.8–2.4rem / 900, with the number clamp 2–2.6rem / 900 and 2.4rem silks on the same row. Amount on the slip jumps to 2.6rem / 800 — a figure, not a heading. Call PnL and vault purse share clamp 2.2–3.2rem / 800 as a right-aligned pair. Overlay purse is 2.4rem / 800, left-aligned. Overlay shares and book PnL use that same 2.4rem / 800. Book-bar PnL and capital figures are 1.7rem / 800 on one baseline. Boxed YOUR BOOK is the same 3px rectangle at 1.35rem / 800, not a second masthead. Receipt “see this horse” is Title-adjacent 1.6rem / 800.
- **Body** (400, 1.05rem, line-height 1.25): Markets line, slip lead, facts notes, last-backer line. Colophon is 1.15rem / 700. Agate measure is short (~42–46ch), not a novel column. Field notes and form notes sit at 0.92rem. Tote pedigree under the name is 0.78rem. Book-gate copy is centered Body, max 36ch.
- **Label** (700, 0.8–0.95rem, letter-spacing 0.08–0.12em, uppercase): Dates, PP headers, purse captions, amount labels, chip text, Connect, papers legends, tote-head, conditions chips, status tags, tvl-max (`0.72rem` / 0.08em), Copy / Disconnect, EIP-6963 wallet names. Pedigree lines are 600 / 0.06em uppercase under the name — a racing line, not a heading. Fact rows on `/enter` are 700 / 0.04em uppercase with inverted program numerals. Withdraw is uppercase Label at 0.1em with a 400 / 0.04em sentence-case lock line under it. Book-bar figure captions are 0.75rem / 0.1em uppercase on the same baseline as the 1.7rem figures. The truncated address chip is Label-weight agate but not uppercase: 700 / 0.04em tabular (`0x1234…5678`). The full address on the slip is 0.8rem / 600 tabular, break-all.

Figures use `font-variant-numeric: tabular-nums`. Positive PnL prefixes `+` in Purse Green; losses print the minus in Loss Crimson. Placeholders mix 72% ink into Sheet Stock. Owner-only shares and capital print as an em dash, not a zero.

### Named Rules

**The Call-is-Bigger Rule.** On a call surface, the selected horse name outranks MARKETO. Product chrome never out-shouts the horse you are looking at. The racing card is that call. The `/program` and `/portfolio` overlays are compact calls: louder than the tote row, quiet enough that Deposit stays in the first view. The `/enter` miniature is a preview, not a second call.

**The Agate Rule.** Past performances, chips, locale, facts copy, tote columns, conditions, last backer, and captions set in Barlow Condensed. Big Shoulders is for names, program numbers, purses, boxed titles, and keyed-in amounts only.

## Layout

The sheet is a full-viewport card (`min-height: 100dvh`). The racing card has three stacked bands: masthead, fold, program strip, then a centered colophon. `/program` has three: masthead, conditions chips, tote (overlay on top). `/portfolio` has three: masthead, book bar, tote (overlay on top). `/enter` has two: masthead, then the book. Interior tables use 1px ink or 22% ink hairlines. Padding clusters around 0.85–1.25rem on the sheet edge; tight clusters inside a band use 0.2–0.55rem.

Masthead is three columns (mark / meta / actions), aligned to the baseline of the wordmark. Actions pack locale, then a single-line nav (`Your book` / `The program` / `Enter a horse`) split by a 1px ink stick, then session last behind a matching 1px stick: ink-fill Connect when disconnected, outline truncated-address chip when connected. On the racing card, the fold is a wide call beside a narrower slip (`1.7fr | 0.72fr`); the call’s money column is total PnL beside vault purse (tote order, same figure scale); the program strip is equal columns of unselected in-form horses plus a door to `/program`. Enter-a-horse is not on this sheet: the masthead links to `/enter` with the authored horse-and-jockey mark. The program is an underlined The program mark. The book is an underlined Your book mark. No Enter self-link on `/enter`. No The program self-link on `/program`. No Your book self-link on `/portfolio`.

On `/program`, conditions are a wrap row (`0.55rem 1.25rem`) under a 3px rule. A 1px × 1.1rem ink stick splits status chips (Active / Inactive) from sort chips (Age, Created, PnL, Purse). The tote is a nine-column grid (`2.4rem | 2.4rem | minmax(7rem, 1.3fr) | 8.4rem | 3.4rem | 5.2rem | 6.2rem | minmax(7.5rem, 1.1fr) | 6.2rem`): No., silks, horse, vault, age, created, PnL, purse, status. Header is uppercase agate on a 1px ink underline, tight (`0.28rem 1.25rem 0.22rem`); the tote packs rows from the top so leftover viewport height does not stretch the header away from the conditions bar. Opening a horse (`?horse=` on the same `/program` URL) slides a 40% Hot Sheet from the right: compact one-row call (number + 2.4rem silks + name at Title scale), past performances, purse fill-to-max, last backer, Deposit stamp. Escape and the ghost Close mark dismiss it. There is no colophon on `/program`.

On `/portfolio`, the book bar is one flex row (`0.4rem 1.25rem`) under a 3px rule: boxed YOUR BOOK, a 3px vertical ink rule, inline PnL and capital at risk on one baseline with the SYNTHETIC tag, then BACKED / MINE / ALL chips on the far right (ALL default). Pressing an already-on role chip returns to ALL. Figures appear only after the wallet is connected; the disconnected sheet shows a centered Connect gate instead of a tote. The book tote uses the same column rhythm as `/program` (`2.4rem | 2.4rem | minmax(7rem, 1.3fr) | 8.4rem | 7.4rem | 5.2rem | 6.2rem | minmax(7.5rem, 1.1fr)`): No., silks, horse, vault, role, shares, PnL, capital. Name and capital take the leftover width; names ellipsize if they overflow. Opening a holding (`?horse=` on the same `/portfolio` URL) slides the same 40% Hot Sheet from the right: compact one-row call, shares and PnL at overlay-purse scale, then DEPOSIT / WITHDRAW invert chips, an amount for that direction only, and either the Deposit stamp or outlined Withdraw — never both. Owner-only overlays print a watch-only note and withhold both actions. Book-bar totals sum backed PnL and capital only. There is no colophon on `/portfolio`.

On `/enter`, the book is two pages (`0.82fr | 1.18fr`) divided by a 3px ink rule. Left: What entering is — numbered facts 01–03 as inverted 2.1rem ink squares, then a miniature call that writes as the papers fill, boxed in 1px ink. Right: Entry papers on a 55% Hot Sheet wash — name, silks, strategy, wallet, opening purse — with How it works (in-page) and the Open vault stamp at the foot. After a successful stamp, the right page becomes a receipt plus See this horse on the card. There is no colophon on `/enter`.

At `900px` every multi-column grid collapses to one column: the call or facts rule moves from right to bottom, program entries stack with 1px ink underlines, the purse-and-PnL pair left-aligns and spans the call, papers-foot stacks stamp above the how-link, and the card releases `100dvh`. Masthead-actions become a two-column grid: locale left and account right on the first row; nav full-width on the second, losing its left stick. On `/program` the tote-head hides; each row becomes a three-line grid (`num silks name status` / `age created` / `pnl purse`). On `/portfolio` the book-bar chips and figures take the full width; the tote-head hides; each row becomes a three-line grid (`num silks name role` / `shares pnl` / `bar bar`). The overlay is a fixed full-viewport Sheet Stock sheet (`inset: 0`) with the stamp foot stuck to the bottom.

**The Ruled-Sheet Rule.** New regions join the card with a 3px ink rule, not a card-in-a-card, not a shadow, not extra outer margin. Hairlines are for rows inside a region.

**The Two-Page Rule.** Entering is facts left, papers right. Do not recast `/enter` as a wizard, a stepper, a modal, or a settings panel, and do not put the nomination form back on the racing card.

**The Tote Overlay Rule.** Opening a horse on `/program` or `/portfolio` is `?horse=` on that sheet and a 40% Hot Sheet from the right. Do not add a second horse route, a modal, or a dashboard of horse or position cards. The stamp foot sticks at every width. At `900px` the overlay is the whole sheet.

**The Book Tote Rule.** The book is a tote of horses the connected wallet already holds. Filter BACKED / MINE / ALL (ALL default). Book-bar PnL and capital sum backed holdings only. Owner-only rows are watch-only: em dash shares and capital, vault PnL, no Deposit, no Withdraw. Money moves on the overlay, never on the row.

**The Session-Last Rule.** Persistent session lives last in masthead-actions, after locale and nav, split by a 1px ink stick. Connecting is not a hero CTA and not a modal. Stamp-time Connect gates on the slip, overlay, papers, and book share that same Wagmi session. Do not name a chain.

## Elevation & Depth

The sheet is flat ink on paper. There are no box shadows. Depth is press, not lift: multiply-blended newsprint fiber (240×240px hue-less tile), a 55% Hot Sheet wash on the slip and on `/enter` papers, a full Hot Sheet overlay on `/program` and `/portfolio` (desktop), 8% ink wash on a pressed program entry, tote row, or Withdraw hover, and the Deposit / Open-vault stamps multiplied into the paper. The account slip is a small Hot Sheet + newsprint panel (`z-index: 8`) dropped below-right of the chip, 2px ink box — another impression, not a floating dialog. The overlay enters with `translateX(12%) → 0` over 280ms (`cubic-bezier(0.16, 1, 0.3, 1)`); reduced motion kills the animation. Focus is a 2px ink outline with 3px offset. Text selection and the caret are ink.

### Shadow Vocabulary

None. `box-shadow` stays `none` on fields.

### Named Rules

**The Pressed-Ink Rule.** If something needs to sit “on” the sheet, multiply it or wash it. Do not raise it. The overlay is another impression of the same paper, not a floating panel. The account slip is the same: Hot Sheet + newsprint, not a glass dialog.

## Shapes

Every corner is a square cut (`border-radius: 0` on the sheet and all controls). Silks are squares, not circles. Slip and papers titles are a 3px ink rectangle around extra-condensed type. The book-bar title uses that same 3px rectangle, smaller. Amount and papers fields have no box: they are a 3px ink underline. Chips, Connect, and the address chip are sharp rectangles with 1–2px ink strokes. The account slip is a 2px ink rectangle of Hot Sheet. EIP-6963 wallet names are full-width invert chips. Withdraw is a 1px ink rectangle, not a stamp and not an invert chip. Selected silks on papers take a 3px ink edge and a filled ink triangle at the top-right — a corner tick, not a check glyph. The purse fill-to-max is a 1px ink-ruled track (`0.55rem` in the tote, `0.7rem` in the overlay) filled with Carbon Ink to the percent of max; max caption prints in ink, not green. On the book tote the same track fills to backed capital over vault. Active status is an inverted ink rectangle; Scratched is the same box, transparent, 1px ink stroke. BACKED reuses the Active invert; MINE reuses the Scratched outline. The only tilted, distressed rectangles are the Deposit and Open-vault rubber stamps.

**The Square-Cut Rule.** Radius is always 0. Pills, squircles, and rounded fields are off the card.

**The Ruled-Fill Rule.** Purse fill-to-max is a 1px ink-ruled track filled with Carbon Ink. The purse figure prints in Purse Green; the bar does not. Do not fill the track with green or a gradient.

## Components

Tactile like a form you mark with a pencil, then stamp.

### Buttons

- **Shape:** Square-cut. No radius.
- **Primary (Connect):** Carbon Ink fill, Hot Sheet type, 2px ink edge, 0.35rem 0.55rem, uppercase tracked label. Persistent session on the masthead (last in masthead-actions) and the stamp-time gate — on the slip after Deposit intent, on `/enter` after Open vault if still disconnected, on the `/program` overlay after Deposit intent, on the `/portfolio` gate before the book can be read, and on the `/portfolio` overlay after Deposit or Withdraw intent. Pending prints Connecting… at 0.72 opacity, cursor wait. Empty provider prints “No browser wallet found. Install one, then try again.” No separate hover fill in the shipped sheet; keyboard focus uses the global 2px ink outline. Never the nomination or the bet. Never a modal.
- **Chips (amount adders, wallet same/other, conditions):** Transparent field, 1px ink stroke, 0.15rem 0.45rem. Hover and pressed/checked invert to ink fill / Hot Sheet type. Conditions chips add uppercase 0.8rem / 0.08em tracking. Book overlay DEPOSIT / WITHDRAW chips use that same conditions type; one is always pressed.
- **Withdraw:** Transparent field, 1px Carbon Ink stroke, 0.45rem 0.65rem, width capped at 22rem, uppercase tracked Label with a sentence-case lock line under it. Hover and focus take the 8% ink wash. Disabled at 0.35 opacity until an amount is in. Shown only when the WITHDRAW chip is pressed. Not a stamp, not an invert, not Purse Green.
- **Ghost text (inactive locale, How it works, Enter link, overlay Close):** No box. Underline with 3px offset. The horse mark carries the home Enter link; MARKETO is an undecorated home link. Overlay Close is right-aligned, uppercase, tracked.

### Chips

- **Style:** Amount and wallet chips as above. Conditions chips are the same invert language in a toolbar: status (Active / Inactive), a 1px ink stick, then sorts (Age, Created, PnL, Purse). Book-bar chips omit the stick and sit on the far right: BACKED, MINE, ALL. Book overlay slip chips are a two-press radio: DEPOSIT or WITHDRAW; the amount and the one action follow. Pressing a sort again flips asc/desc; pressing an already-on status or role chip returns to all. SYNTHETIC tags are not chips: they are tight inverted ink rectangles, 0.12em tracking, riding a caption.
- **State:** Chip hover and checked/pressed = invert. Tag has no hover; it is a condition printed on the line.

### Cards / Containers

- **Corner Style:** Square cut
- **Background:** The page is the card (Sheet Stock + newsprint). Inner wash (55% Hot Sheet) on the slip and on `/enter` papers; when a horse is open or silks are picked, that wash is the silks-hue paper (`--wash-btc` / `--wash-eth`, hot variants on slip, papers, desktop overlay). The selected call takes a translucent silks wash so grain shows. The miniature is Sheet Stock inside a 1px ink box, not a second wash and not a silks stain. The `/program` and `/portfolio` overlays are a full stained Hot Sheet + newsprint; at `900px` they are stained Sheet Stock + newsprint.
- **Shadow Strategy:** None
- **Border:** 3px ink around slip / papers / book-bar titles and between bands; 3px ink on the overlay’s left edge; 1px dashed ink around the estimated-shares strip; 1px solid ink around the miniature; 1px solid ink around Withdraw
- **Internal Padding:** ~1rem on the slip; 1.1–1.25rem on papers; ~0.7–0.9rem on program entries and the miniature; overlay `1rem 1.1rem 1.4rem`; tote rows `0.55rem 1.25rem`; book bar `0.4rem 1.25rem`

### Inputs / Fields

- **Style:** Transparent, no box, 3px Carbon Ink underline. Amount uses Display-adjacent 2.6rem / 800 tabular figures; papers fields use 1.6rem / 700. Number spinners are stripped. Character counts sit at the end of the field in 400 / 0.06em.
- **Focus:** Global ink outline (2px / 3px offset), not a glow
- **Error / Disabled:** Notes under the field in 0.92rem agate; the sheet does not paint error red (red is BTC silks). Scratched and full-purse horses withhold the overlay stamp and print a slip note instead. Owner-only overlays withhold Deposit and Withdraw and print a watch-only note.

### Navigation

- **Style:** Masthead, not an app bar. MARKETO wordmark (links home); weekday-long date + dreamDEX line; locale invert-buttons; a single-line nav of underlined marks: Your book to `/portfolio`, The program to `/program`; on the racing card, Enter a horse with the authored horse-and-jockey mark (`currentColor` ink) to `/enter`. Session control sits last in masthead-actions, after the nav, behind a 1px ink stick. No Enter self-link on `/enter`. No The program self-link on `/program`. No Your book self-link on `/portfolio`. No Markets / Vaults / Docs chrome.
- **Locale:** Underlined until pressed; `aria-pressed="true"` fills ink and drops the underline.
- **Program door:** The racing-card strip ends with a full-width entry that is only an underlined Title (1.25rem) linking to `/program`. Empty in-form fold uses the same How-it-works underline to the tote. Empty book filters use the same underline to `/program` (no backed horses) or `/enter` (no owned horses).

### Account Chip

Connected session on the masthead. 1px Carbon Ink outline, transparent field, 0.2rem 0.45rem, 700 / 0.04em tabular truncated address (`0x1234…5678`, first six + last four). Hover and `aria-expanded="true"` invert to ink fill / Hot Sheet. Title is the full address. Not uppercase. Not a silks square. Not a wallet-logo avatar. Click opens the account slip.

### Account Slip

Hot Sheet + newsprint multiply, 2px ink box, 0.45rem padding, min 14rem / max `min(22rem, calc(100vw - 2rem))`, dropped below-right of the chip (`top: calc(100% + 0.35rem)`, `right: 0`, `z-index: 8`). Full address in 0.8rem / 600 tabular, break-all; then Copy and Disconnect as full-width 1px invert chips (uppercase 0.08em, 0.25rem 0.45rem). Copy prints Copied. Escape and outside pointer dismiss. When connecting with more than one provider, the slip holds the wallet list plus an error note. Not a modal, not a 40% overlay, not a 55% wash.

### Wallet List

EIP-6963 announced wallets as stacked full-width invert chips (1px ink, 0.25rem 0.45rem, uppercase 0.08em). Injected fallback labels Browser wallet. Names only — no logos, no avatars. Appears in the account slip when connecting with more than one provider, and under stamp-time ConnectGate. Book-gate list centers at max 18rem. Nomination papers still use the existing same/other wallet chips; those are not this list.

### Market Silks

Square of BTC or ETH color; market letters in Hot Sheet, Big Shoulders 800. Call and overlay 3.4rem; slip 2.1rem; program strip and tote 2rem; miniature / receipt 2.6rem; papers pick 4.2rem. Always the two-letter market, never an icon. On `/enter`, the selected pick carries a 3px ink border and a black corner tick (ink triangle at the top-right). Unselected picks have a transparent 3px edge so the squares do not jump.

### Numbered Facts

The 01–03 list on the left page. Each index is a 2.1rem inverted ink square, Big Shoulders 800 / 1.15rem, Hot Sheet numerals. The row is uppercase agate. These are printed program numerals, not kickers and not interactive chips.

### Miniature Call

Live preview on the facts page: program number, silks, name, pedigree, empty PP with SYNTHETIC, purse in Purse Green with the ruled fill-to-max and Max caption (cap is 5× opening purse). It writes as the papers fill (name, silks, strategy, purse, max). Same call grammar as the racing card, scaled to sit inside a 1px ink box.

### Deposit Stamp

Primary deposit action is the rubber-stamp raster (`deposit-stamp.webp`) inside a borderless button, `mix-blend-mode: multiply`, max width 22rem. On the racing-card slip it centers; on the `/program` overlay it left-aligns at the same max. On `/portfolio` it appears only after DEPOSIT is pressed, left-aligned, disabled until an amount is in. Hover/focus adds `contrast(1.12) brightness(0.96)` over 160ms (`cubic-bezier(0.16, 1, 0.3, 1)`); reduced motion kills the transition. Disabled at 0.35 opacity. Do not replace this with a filled Primary button. Connect-wallet remains the ink rectangle because it is a wallet gate, not the bet. Deposit lives on the overlay, never on a tote row.

### Open Vault Stamp

On `/enter`, the nomination action is the matching rubber-stamp raster (`open-vault-stamp.webp`): OPEN VAULT / YOU STILL SIGN, same multiply blend and hover. Foot of the papers: max width 18rem, right-aligned beside How it works; at 900px it centers at 22rem above the link. Do not replace it with the Connect ink-fill.

### Withdraw

Redeem on a backed `/portfolio` overlay after the WITHDRAW chip is pressed. 1px Carbon Ink outline, square-cut, left-aligned, width capped at 22rem. Uppercase tracked label plus a sentence-case lock line. Hover washes 8% ink. Disabled until an amount is in. Not a rubber stamp, not Purse Green, not an invert chip. Never stacked under the Deposit stamp — the chips pick one direction. Withheld on owner-only and when there is no NAV to redeem. All NAV fills the field with capital plus PnL.

### Program Entry

Full-width button on the racing-card strip, four-column inner grid (number, silks, name+agate PP, purse). 1px ink at the right (bottom at 900px). Hover and `aria-pressed="true"` take the 8% ink wash. Entry names are Title; numbers are Display-family 2rem / 900.

### Tote Row

Full-bleed button on `/program` and `/portfolio`. Nine columns on the program (including vault); eight on the book with the same leading rhythm (number, silks, name `1.3fr`, vault) then role, shares, PnL, capital `1.1fr`. Header is a tight agate rule (`0.28rem 1.25rem 0.22rem`, 0.75rem), packed to the top of the tote so leftover height does not open a gap under the conditions or book bar. Three stacked lines at `900px`. Hover and `aria-pressed="true"` take the 8% ink wash. Numbers 1.7rem / 900; names 1.55rem / 800 uppercase; silks 2rem. Purse or capital figure in Purse Green above the ruled fill bar; max caption in ink. Active status inverts; Scratched outlines. Book ROLE prints BACKED as the Active invert and MINE as the Scratched outline; a row may carry both.

### Ruled Fill Bar

1px ink rectangle, transparent field, Carbon Ink fill to `purseFill` percent (or backed capital over vault on the book tote). Height 0.55rem in the tote, 0.7rem in the overlay. Companion max line is uppercase agate in Carbon Ink. Not a green bar, not a gradient, not a rounded pill.

### Status Tag

Printed condition on the tote row. Active: inverted ink / Hot Sheet, 0.75rem / 0.1em. Scratched: transparent with 1px ink stroke, same type. Book ROLE reuses this pair for BACKED / MINE. Not a kicker and not a chip — it does not filter; the conditions toolbar does.

### Hot Sheet Overlay

Right-hand 40% sheet on `/program` or `/portfolio` when `?horse=` is set. Absolute, 3px ink left rule, silks-washed Hot Sheet + newsprint multiply, `z-index: 2`. The call is one compact row — program number, 2.4rem silks, name at Title scale — so amount, chips, and Deposit stay in the first view. Pedigree and vault sit under the name. A 3px rule cuts the call from the agate below. Display-scale type stays on the racing card; the overlay does not borrow it. On `/program`: tighter PP columns, left-aligned 2.4rem purse, last-backer agate, then the overlay slip (amount, chips, stamp). The stamp is capped at 14rem on the overlay. `.overlay-foot` sticks to the bottom on the same stained stock at every width, so Deposit stays in view. On `/portfolio`: two-column shares and PnL at 2.4rem, then DEPOSIT / WITHDRAW invert chips, an amount labeled for that direction, and either the Deposit stamp or outlined Withdraw. Owner-only prints a watch-only note instead. At `900px` it is `position: fixed; inset: 0`, stained Sheet Stock + newsprint, `z-index: 9` (above the masthead, because the overlay *is* the sheet), and `.overlay-foot` sticks to the bottom on the same stained stock. Not a modal, not a card, not a second route.

### Book Bar

Result strip under the `/portfolio` masthead. Boxed YOUR BOOK (3px ink, 1.35rem Title), 3px vertical ink rule, PnL and capital at risk on one baseline (1.7rem Title figures, agate captions), SYNTHETIC tag, BACKED / MINE / ALL chips pushed to the far right. Connected only: the disconnected sheet has no figures. Not a second masthead and not a dashboard header.

### Past-Performance Rows

Five agate columns (date, window, vs-market, side, PnL). Tabular numbers. 1px 22% ink hairline under each row. Header is uppercase 0.85rem with a 1px solid ink underline. Overlay PP tightens the column template (`4.6rem 2.2rem 4.6rem 2.4rem 1fr`). The vs-market cell is silks-ink plus a 0.5rem silks square; side and date stay carbon.

### Receipt

After a successful Open vault, the papers page keeps the Hot Sheet wash and boxed title, then a picked-horse line, purse, wallet message, and See this horse on the card (Title link with 3px underline offset). Same sheet; no modal, no toast.

## Do's and Don'ts

### Do:

- **Do** ground new surfaces on Sheet Stock with the newsprint tile at 240px, `background-blend-mode: multiply`.
- **Do** cut regions with 3px Carbon Ink rules and keep every radius at 0.
- **Do** identify a market with silks squares (BTC cherry, ETH periwinkle) and extra-condensed letters.
- **Do** print vs-market in silks-ink with a 0.5rem silks square in the PP table; stain only the open horse’s call, slip, overlay, or papers.
- **Do** mark the selected silks pick with a 3px ink edge and a top-right corner tick.
- **Do** print purses and winning PnL in Purse Green; print losses in Loss Crimson.
- **Do** set horse names and program numbers in Big Shoulders Display 800–900; set tables, labels, and notes in Barlow Condensed.
- **Do** invert to ink-on-Hot-Sheet for selection, chip hover/checked, active locale, fact numerals, Active status, and the open account chip.
- **Do** stamp Deposit and Open vault; outline Withdraw 1px ink; fill Connect.
- **Do** keep session last in masthead-actions, behind a 1px ink stick.
- **Do** print the connected account as an outline truncated-address chip; invert it while the slip is open.
- **Do** list EIP-6963 wallets as invert chips of the provider name.
- **Do** wash the slip and the papers at 55% Hot Sheet; print the `/program` and `/portfolio` overlays as a full Hot Sheet.
- **Do** mark non-chain figures with the inverted SYNTHETIC tag.
- **Do** open a horse on `/program` or `/portfolio` as a 40% Hot Sheet (`?horse=`), with the stamp foot stuck at the foot at `900px`.
- **Do** fill purse-to-max with a 1px ink-ruled track and an ink bar.
- **Do** print BACKED as the Active invert and MINE as the Scratched outline; a book row may carry both.
- **Do** sum book-bar PnL and capital from backed holdings only.

### Don't:

- **Don't** ship a dark DeFi hero with three equal feature cards. Cooler stock is still a printed sheet, not a night-mode invert of dreamDEX’s terminal.
- **Don't** round corners, raise shadows, or frost glass over the sheet.
- **Don't** give heroes photographic portraits or coin-logo avatars; silks carry identity.
- **Don't** recast BTC as orange or ETH as cyan; those silks are locked to cherry and periwinkle.
- **Don't** set body type in BTC/ETH fill hues; use silks-ink. Don't stripe the tote or stain the miniature.
- **Don't** use Purse Green for losses, links, large fills that are not money or the stamp, or the purse fill-to-max bar. Don't paint losing PnL in Carbon Ink or in BTC silks fill.
- **Don't** let MARKETO or UI labels out-size the selected horse name on a call surface.
- **Don't** swap the Deposit or Open-vault stamp for a gradient CTA or a second ink-fill button.
- **Don't** stamp Withdraw; it is a 1px ink outline, not a rubber stamp.
- **Don't** show the Deposit stamp and Withdraw on the same slip at once; invert chips pick the direction, then one action.
- **Don't** recast Connect as a hero CTA, a modal, or RainbowKit glass.
- **Don't** draw wallet-logo avatars or a second wallet identity system.
- **Don't** name a chain in the UI until a network is chosen.
- **Don't** recast `/enter` as a wizard, stepper, or settings form, or put nomination fields back on the racing card.
- **Don't** recast `/program` or `/portfolio` as a dashboard of horse or position cards, a modal, or a second horse route.
- **Don't** put Deposit or Withdraw on a tote row; money moves on the overlay.
- **Don't** let an owner-only overlay redeem depositor funds.
- **Don't** replace the silks corner tick with a check glyph or a circular radio.
- **Don't** substitute Inter, system UI, or a serif editorial face for the athletic gothic / agate pairing.
