<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ConnectGate from './ConnectGate.svelte';
	import type { DepositPhase } from '$lib/chain/depositFlow';

	let {
		phase,
		rejectedApprove,
		amount,
		live,
		connected,
		onProductChain,
		intent,
		busy = false,
		onswitch
	}: {
		phase: DepositPhase;
		rejectedApprove: boolean;
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
	<p class="wallet-msg">{m.deposit_confirmed()}</p>
{:else if amount <= 0}
	<p class="slip-note">{m.need_amount()}</p>
{:else if phase === 'not_live' || (intent && !live)}
	<p class="slip-note">{m.deposit_not_live()}</p>
{:else if intent && !connected}
	<p class="wallet-msg">{m.connect_to_sign()}</p>
	<ConnectGate />
{:else if phase === 'wrong_network' || (intent && connected && !onProductChain)}
	<p class="wallet-msg">{m.wrong_network()}</p>
	<div class="chips">
		<button type="button" onclick={onswitch} disabled={busy}>{m.switch_network()}</button>
	</div>
{:else if phase === 'approving'}
	<p class="wallet-msg">{m.deposit_approving()}</p>
{:else if phase === 'pending'}
	<p class="wallet-msg">{m.deposit_pending()}</p>
{:else if phase === 'rejected' && rejectedApprove}
	<p class="form-note">{m.rejected_approve()}</p>
{:else if phase === 'rejected'}
	<p class="form-note">{m.deposit_rejected()}</p>
{:else if phase === 'reverted'}
	<p class="form-note">{m.deposit_reverted()}</p>
{:else if phase === 'rpc_error'}
	<p class="form-note">{m.deposit_rpc()}</p>
{:else if phase === 'cap_exceeded'}
	<p class="form-note">{m.deposit_cap()}</p>
{:else if connected}
	<p class="wallet-msg">{m.wallet_ready()}</p>
{:else}
	<p class="slip-note">{m.deposit_wallet_note()}</p>
{/if}
