<script lang="ts">
	import type { Connector } from '@wagmi/core';
	import { m } from '$lib/paraglide/messages.js';
	import { wallet, type ConnectErrorKind } from '$lib/wallet/session.svelte';
	import { shortAddress } from '$lib/wallet/address';
	import WalletPicker from './WalletPicker.svelte';

	let open = $state(false);
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;
	let root: HTMLDivElement | undefined;

	function errorCopy(kind: ConnectErrorKind) {
		if (kind === 'rejected') return m.connect_canceled();
		if (kind === 'unavailable') return m.connect_unavailable();
		if (kind === 'none') return m.no_wallet();
		return m.connect_failed();
	}

	function close() {
		open = false;
		copied = false;
	}

	async function onConnect() {
		wallet.clearError();
		const result = await wallet.connect();
		open = result === 'pick' || result === 'error';
	}

	async function onPick(connector: Connector) {
		const result = await wallet.connect(connector);
		if (result === 'ok') close();
	}

	async function onCopy() {
		if (!wallet.address) return;
		try {
			await navigator.clipboard.writeText(wallet.address);
		} catch {
			const field = document.createElement('textarea');
			field.value = wallet.address;
			field.setAttribute('readonly', '');
			field.style.position = 'fixed';
			field.style.left = '-9999px';
			document.body.appendChild(field);
			field.select();
			document.execCommand('copy');
			field.remove();
		}
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			copied = false;
		}, 1600);
	}

	async function onDisconnect() {
		await wallet.disconnect();
		close();
	}

	function onDocumentPointer(event: PointerEvent) {
		if (!open || !root) return;
		if (event.target instanceof Node && !root.contains(event.target)) close();
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			close();
		}
	}
</script>

<svelte:window onpointerdown={onDocumentPointer} onkeydown={onKey} />

<div class="account" bind:this={root}>
	{#if wallet.connected && wallet.address}
		<button
			class="account-chip"
			type="button"
			aria-expanded={open}
			aria-haspopup="menu"
			aria-controls="account-menu"
			title={wallet.address}
			onclick={() => {
				open = !open;
				copied = false;
			}}
		>
			{shortAddress(wallet.address)}
		</button>
		{#if open}
			<div class="account-menu" id="account-menu" role="menu">
				<p class="account-full">{wallet.address}</p>
				<button type="button" role="menuitem" onclick={onCopy}>
					{copied ? m.copied() : m.copy_address()}
				</button>
				<button type="button" role="menuitem" onclick={onDisconnect}>{m.disconnect()}</button>
			</div>
		{/if}
	{:else}
		<button
			class="account-connect"
			type="button"
			disabled={wallet.pending}
			aria-expanded={open}
			aria-haspopup="menu"
			onclick={onConnect}
		>
			{wallet.pending ? m.connecting() : m.connect_wallet()}
		</button>
		{#if open}
			<div class="account-menu" role="menu">
				{#if wallet.wallets.length > 1}
					<WalletPicker disabled={wallet.pending} onpick={onPick} />
				{/if}
				{#if wallet.error}
					<p class="account-note">{errorCopy(wallet.error)}</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>
