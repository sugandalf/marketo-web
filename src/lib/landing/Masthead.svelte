<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import HorseMark from './HorseMark.svelte';

	let {
		showEnter = true,
		showProgram = true,
		showBook = true
	}: { showEnter?: boolean; showProgram?: boolean; showBook?: boolean } = $props();

	function cardDate() {
		return new Intl.DateTimeFormat(getLocale() === 'id' ? 'id-ID' : 'en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date());
	}
</script>

<header class="masthead">
	<a class="mark" href={resolve(localizeHref('/') as Pathname)}>{m.site_title()}</a>
	<div class="masthead-meta">
		<p class="card-date">{cardDate()}</p>
		<p class="markets-line">
			{m.masthead_before()}
			<a href="https://www.dreamdex.io/" rel="noreferrer">dreamDEX</a>
			{m.masthead_after()}
		</p>
	</div>
	<div class="masthead-actions">
		<div class="locale">
			{#each locales as locale (locale)}
				<button
					type="button"
					aria-pressed={getLocale() === locale}
					onclick={() => setLocale(locale)}
				>
					{locale === 'en' ? m.locale_en() : m.locale_id()}
				</button>
			{/each}
		</div>
		<nav class="masthead-nav" aria-label={m.site_title()}>
			{#if showBook}
				<a class="program-link" href={resolve(localizeHref('/portfolio') as Pathname)}>
					{m.the_book()}
					<small>{m.the_book_hint()}</small>
				</a>
			{/if}
			{#if showProgram}
				<a class="program-link" href={resolve(localizeHref('/program') as Pathname)}>
					{m.the_program()}
					<small>{m.the_program_hint()}</small>
				</a>
			{/if}
			{#if showEnter}
				<a class="enter-link" href={resolve(localizeHref('/enter') as Pathname)}>
					<HorseMark />
					<span>
						{m.enter_horse()}
						<small>{m.enter_horse_hint()}</small>
					</span>
				</a>
			{/if}
		</nav>
	</div>
</header>
