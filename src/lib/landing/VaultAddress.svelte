<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { explorerAddressUrl } from '$lib/chain/config';
	import { shortAddress } from '$lib/wallet/address';

	let { address, compact = false }: { address: string; compact?: boolean } = $props();

	const href = $derived(explorerAddressUrl(address));
	const label = $derived(shortAddress(address));
</script>

{#if compact}
	<a
		class="tote-vault"
		{href}
		target="_blank"
		rel="noopener noreferrer"
		aria-label={m.open_vault_explorer({ address: label })}
		onclick={(event) => event.stopPropagation()}
		onkeydown={(event) => event.stopPropagation()}>{label}</a
	>
{:else}
	<p class="vault-line">
		<span>{m.vault_address()}</span>
		<a
			{href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={m.open_vault_explorer({ address: label })}>{label}</a
		>
	</p>
{/if}
