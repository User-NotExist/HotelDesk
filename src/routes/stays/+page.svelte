<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	let { data }: PageProps = $props();
	function pageHref(page: number) {
		return `/stays?page=${page}${data.status ? `&status=${encodeURIComponent(data.status)}` : ''}`;
	}
</script>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Stays</h1>
		<p class="text-muted-foreground">Reservations, current occupants, and history.</p>
	</div>
	<Button href="/stays/new">New reservation</Button>
</div>
<Card.Root
	><Card.Header><Card.Title>Filter stays</Card.Title></Card.Header><Card.Content
		><form method="GET" class="flex flex-wrap items-end gap-3">
			<div class="flex flex-col gap-2">
				<label for="status" class="text-sm font-medium">Status</label><select
					id="status"
					name="status"
					class="h-9 rounded-md border border-input bg-background px-3 text-sm"
					><option value="">All statuses</option
					>{#each ['RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as status (status)}<option
							value={status}
							selected={data.status === status}>{status.replaceAll('_', ' ')}</option
						>{/each}</select
				>
			</div>
			<Button type="submit">Apply</Button>
		</form></Card.Content
	></Card.Root
>
<Card.Root
	><Card.Header
		><Card.Title>Stay list</Card.Title><Card.Description>{data.total} stays found</Card.Description
		></Card.Header
	><Card.Content>
		{#if data.stays.length}<Table.Root
				><Table.Header
					><Table.Row
						><Table.Head>Room</Table.Head><Table.Head>Primary guest</Table.Head><Table.Head
							>Arrival</Table.Head
						><Table.Head>Departure</Table.Head><Table.Head>Status</Table.Head><Table.Head
						></Table.Head></Table.Row
					></Table.Header
				><Table.Body>
					{#each data.stays as stay (stay.id)}<Table.Row
							><Table.Cell>{stay.room.name}</Table.Cell><Table.Cell
								>{stay.guests[0]?.guest.first_name ?? '—'}
								{stay.guests[0]?.guest.last_name ?? ''}</Table.Cell
							><Table.Cell>{stay.arrival_date.toISOString().slice(0, 10)}</Table.Cell><Table.Cell
								>{stay.departure_date.toISOString().slice(0, 10)}</Table.Cell
							><Table.Cell
								><Badge variant="secondary">{stay.status.replaceAll('_', ' ')}</Badge></Table.Cell
							><Table.Cell
								><Button href={`/stays/${stay.id}`} variant="outline" size="sm">View</Button
								></Table.Cell
							></Table.Row
						>{/each}
				</Table.Body></Table.Root
			>{:else}<p class="text-sm text-muted-foreground">No stays found.</p>{/if}
	</Card.Content></Card.Root
>
{#if data.pages > 1}
	<div class="flex items-center justify-end gap-3 text-sm text-muted-foreground">
		<span>Page {data.page} of {data.pages}</span>
		{#if data.page > 1}<Button href={pageHref(data.page - 1)} variant="outline" size="sm"
				>Previous</Button
			>{/if}
		{#if data.page < data.pages}<Button href={pageHref(data.page + 1)} variant="outline" size="sm"
				>Next</Button
			>{/if}
	</div>
{/if}
