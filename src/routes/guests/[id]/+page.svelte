<script lang="ts">
	import type { PageProps } from './$types';
	import GuestForm from '$lib/components/GuestForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">
			{data.guest.first_name}
			{data.guest.last_name}
		</h1>
		<p class="text-muted-foreground">Guest profile</p>
	</div>
	<Button href="/guests" variant="outline">All guests</Button>
</div>
<GuestForm guest={data.guest} message={form?.message} />
<Card.Root
	><Card.Header><Card.Title>Stay history</Card.Title></Card.Header><Card.Content>
		{#if data.guest.stays.length}<Table.Root
				><Table.Header
					><Table.Row
						><Table.Head>Room</Table.Head><Table.Head>Arrival</Table.Head><Table.Head
							>Role</Table.Head
						><Table.Head>Status</Table.Head><Table.Head></Table.Head></Table.Row
					></Table.Header
				><Table.Body>
					{#each data.guest.stays as member (member.id)}<Table.Row
							><Table.Cell>{member.stay.room.name}</Table.Cell><Table.Cell
								>{member.stay.arrival_date.toISOString().slice(0, 10)}</Table.Cell
							><Table.Cell>{member.role}</Table.Cell><Table.Cell
								><Badge variant="secondary">{member.stay.status.replaceAll('_', ' ')}</Badge
								></Table.Cell
							><Table.Cell
								><Button href={`/stays/${member.stay_id}`} variant="outline" size="sm">View</Button
								></Table.Cell
							></Table.Row
						>{/each}
				</Table.Body></Table.Root
			>{:else}<p class="text-sm text-muted-foreground">No stays yet.</p>{/if}
	</Card.Content></Card.Root
>
