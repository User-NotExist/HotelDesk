<script lang="ts">
	import type { PageProps } from './$types';
	import RoomForm from '$lib/components/RoomForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	let { data, form }: PageProps = $props();
</script>

<div class="flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Room {data.room.name}</h1>
		<p class="text-muted-foreground">
			{data.room.room_type} · Up to {data.room.max_occupant} guests
		</p>
	</div>
	<Button href="/rooms" variant="outline">All rooms</Button>
</div>
<div class="grid gap-6 lg:grid-cols-2">
	<RoomForm room={data.room} message={form?.message} />
	<Card.Root
		><Card.Header
			><Card.Title>Current members</Card.Title><Card.Description
				>Guests checked into this room</Card.Description
			></Card.Header
		><Card.Content>
			{#each data.currentStays as stay (stay.id)}
				<div class="flex flex-col gap-3">
					<Button href={`/stays/${stay.id}`} variant="outline" size="sm">Open stay</Button
					>{#each stay.guests.filter((member) => !member.left_at) as member (member.id)}<p>
							{member.guest.first_name}
							{member.guest.last_name}
							{#if member.role === 'PRIMARY'}<Badge variant="secondary">Primary</Badge>{/if}
						</p>{/each}
				</div>
			{:else}<p class="text-sm text-muted-foreground">No guests checked in.</p>{/each}
		</Card.Content></Card.Root
	>
</div>
<Card.Root
	><Card.Header
		><Card.Title>Stay history</Card.Title><Card.Description
			>Recent and upcoming stays</Card.Description
		></Card.Header
	><Card.Content>
		{#if data.room.stays.length}<Table.Root
				><Table.Header
					><Table.Row
						><Table.Head>Arrival</Table.Head><Table.Head>Departure</Table.Head><Table.Head
							>Status</Table.Head
						><Table.Head></Table.Head></Table.Row
					></Table.Header
				><Table.Body>
					{#each data.room.stays as stay (stay.id)}<Table.Row
							><Table.Cell>{stay.arrival_date.toISOString().slice(0, 10)}</Table.Cell><Table.Cell
								>{stay.departure_date.toISOString().slice(0, 10)}</Table.Cell
							><Table.Cell
								><Badge variant="secondary">{stay.status.replaceAll('_', ' ')}</Badge></Table.Cell
							><Table.Cell
								><Button href={`/stays/${stay.id}`} size="sm" variant="outline">View</Button
								></Table.Cell
							></Table.Row
						>{/each}
				</Table.Body></Table.Root
			>{:else}<p class="text-sm text-muted-foreground">No stays for this room yet.</p>{/if}
	</Card.Content></Card.Root
>
