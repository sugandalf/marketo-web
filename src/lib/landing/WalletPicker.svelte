<script lang="ts">
	import type { Connector } from '@wagmi/core';
	import { m } from '$lib/paraglide/messages.js';
	import { wallet } from '$lib/wallet/session.svelte';

	let {
		disabled = false,
		onpick
	}: {
		disabled?: boolean;
		onpick: (connector: Connector) => void;
	} = $props();
</script>

<div class="wallet-list" role="group" aria-label={m.choose_wallet()}>
	{#each wallet.wallets as connector (connector.uid)}
		<button type="button" {disabled} onclick={() => onpick(connector)}>
			{connector.id === 'injected' ? m.browser_wallet() : connector.name}
		</button>
	{/each}
</div>
