<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	let { children } = $props();
	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/rooms', label: 'Rooms' },
		{ href: '/guests', label: 'Guests' },
		{ href: '/stays', label: 'Stays' }
	] as const;
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen bg-background text-foreground">
	<header class="border-b bg-card">
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
		>
			<a href={resolve('/')} class="text-lg font-semibold tracking-tight">Hotel Desk</a>
			<nav aria-label="Main navigation" class="flex flex-wrap gap-1">
				{#each links as link (link.href)}
					<Button
						href={link.href}
						variant={page.url.pathname === link.href ||
						(link.href !== '/' && page.url.pathname.startsWith(link.href))
							? 'secondary'
							: 'ghost'}
						size="sm">{link.label}</Button
					>
				{/each}
			</nav>
		</div>
	</header>
	<main class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">{@render children()}</main>
	<Separator />
	<footer class="mx-auto max-w-7xl px-4 py-5 text-sm text-muted-foreground sm:px-6">
		Hotel Desk · Staff operations
	</footer>
</div>
