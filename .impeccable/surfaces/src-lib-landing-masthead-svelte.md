---
version: 1
slug: "src-lib-landing-masthead-svelte"
primary_target: "src/lib/landing/Masthead.svelte"
related_targets: ["src/routes/form.css","messages/en.json","messages/id.json","src/lib/landing/WalletControl.svelte","src/routes/+layout.svelte","src/routes/+page.svelte","src/routes/program/+page.svelte","src/routes/enter/+page.svelte","src/routes/portfolio/+page.svelte"]
---

Visitor mode: Operate. Primary target: `src/lib/landing/Masthead.svelte`.

Audience: a spectator who may connect a browser wallet, then become trader, depositor, or vault owner. Session chrome is not a bet.

Job: connect, read who is signed in, copy the address, disconnect. Proof is the truncated address on the masthead and the same session unlocking stamp-time Connect gates. No chain name until a network is chosen.

Direction: inherit the Daily Racing Form world. Persistent session chip last in masthead-actions (after locale and nav). Connected = outline chip with `0x1234…5678` opening a Hot Sheet slip (full address, copy, disconnect). Disconnected = ink-fill Connect. Multiple EIP-6963 wallets list as invert chips, not a modal. Inline Connect on slips / enter / book stays the gate at stamp time.

Memorable moment: address chip inverts open; copy prints Copied; disconnect returns the sheet to spectator.

Constraints: Wagmi Core + injected / EIP-6963 only. Copy through Paraglide. Square-cut, no shadows, no wallet-logo avatars. Do not auto-prompt on load. Do not name a chain. Non-custodial: the app never holds keys.

Unresolved: WalletConnect / mobile QR (needs a Reown project ID); target EVM chain(s); contract-backed signing.
