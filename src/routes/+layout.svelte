<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { wallet } from '$lib/wallet/session.svelte';

	let { children } = $props();

	onMount(() => wallet.start());
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
