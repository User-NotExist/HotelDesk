<script lang="ts">
	import type { PageProps } from './$types';
	import GuestForm from '$lib/components/GuestForm.svelte';
	let { form }: PageProps = $props();
</script>

<div>
	<h1 class="text-3xl font-semibold tracking-tight">Add guest</h1>
	<p class="text-muted-foreground">Add a guest before making a reservation.</p>
</div>
<GuestForm message={form?.message} />
