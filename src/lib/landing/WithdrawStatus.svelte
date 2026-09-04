<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ConnectGate from './ConnectGate.svelte';
	import type { WithdrawPhase } from '$lib/chain/withdrawFlow';

	let {
		phase,
		amount,
		live,
		connected,
		onProductChain,
		intent,
		busy = false,
		onswitch
	}: {
		phase: WithdrawPhase;
		amount: number;
		live: boolean;
		connected: boolean;
		onProductChain: boolean;
		intent: boolean;
		busy?: boolean;
		onswitch: () => void;
	} = $props();
</script>

{#if phase === 'confirmed'}
	<p class="wallet-msg">{m.withdraw_confirmed()}</p>
{:else if amount <= 0}
	<p class="slip-note">{m.need_amount_redeem()}</p>
{:else if phase === 'not_live' || (intent && !live)}
	<p class="slip-note">{m.withdraw_not_live()}</p>
{:else if intent && !connected}
	<p class="wallet-msg">{m.connect_to_sign_withdraw()}</p>
	<ConnectGate />
{:else if phase === 'wrong_network' || (intent && connected && !onProductChain)}
	<p class="wallet-msg">{m.wrong_network()}</p>
	<div class="chips">
		<button type="button" onclick={onswitch} disabled={busy}>{m.switch_network()}</button>
	</div>
{:else if phase === 'pending'}
	<p class="wallet-msg">{m.withdraw_pending()}</p>
{:else if phase === 'rejected'}
	<p class="form-note">{m.withdraw_rejected()}</p>
{:else if phase === 'reverted'}
	<p class="form-note">{m.withdraw_reverted()}</p>
{:else if phase === 'rpc_error'}
	<p class="form-note">{m.withdraw_rpc()}</p>
{:else if phase === 'exceeds_max'}
	<p class="form-note">{m.withdraw_exceeds()}</p>
{:else if connected}
	<p class="wallet-msg">{m.wallet_ready()}</p>
{:else}
	<p class="slip-note">{m.redeem_wallet_note()}</p>
{/if}
