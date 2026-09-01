<script lang="ts">
	import type { Connector } from '@wagmi/core';
	import { m } from '$lib/paraglide/messages.js';
	import { wallet, type ConnectErrorKind } from '$lib/wallet/session.svelte';
	import WalletPicker from './WalletPicker.svelte';

	let { onconnected }: { onconnected?: () => void } = $props();

	let picking = $state(false);

	function errorCopy(kind: ConnectErrorKind) {
		if (kind === 'rejected') return m.connect_canceled();
		if (kind === 'unavailable') return m.connect_unavailable();
		if (kind === 'none') return m.no_wallet();
		return m.connect_failed();
	}

	async function onConnect() {
		wallet.clearError();
		const result = await wallet.connect();
		if (result === 'pick') {
			picking = true;
			return;
		}
		picking = false;
		if (result === 'ok') onconnected?.();
	}

	async function onPick(connector: Connector) {
		const result = await wallet.connect(connector);
		if (result === 'ok') {
			picking = false;
			onconnected?.();
		}
	}
</script>

{#if wallet.pending && !wallet.address}
	<p class="wallet-msg">{m.connecting()}</p>
{:else}
	<button class="connect" type="button" disabled={wallet.pending} onclick={onConnect}>
		{wallet.pending ? m.connecting() : m.connect_wallet()}
	</button>
	{#if picking && wallet.wallets.length > 1}
		<WalletPicker disabled={wallet.pending} onpick={onPick} />
	{/if}
	{#if wallet.error}
		<p class="form-note">{errorCopy(wallet.error)}</p>
	{/if}
{/if}
