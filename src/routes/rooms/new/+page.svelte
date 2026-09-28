<script lang="ts">
	import type { PageProps } from './$types';
	import RoomForm from '$lib/components/RoomForm.svelte';
	let { form }: PageProps = $props();
</script>

<div>
	<h1 class="text-3xl font-semibold tracking-tight">Add room</h1>
	<p class="text-muted-foreground">Create a room for reservations and stays.</p>
</div>
<RoomForm message={form?.message} />
