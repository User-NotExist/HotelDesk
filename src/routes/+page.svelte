<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	let { data }: PageProps = $props();
</script>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<p class="text-sm text-muted-foreground">{data.today}</p>
		<h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
		<p class="mt-1 text-muted-foreground">Today at the front desk</p>
	</div>
	<Button href="/stays/new">New reservation</Button>
</div>
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	{#each [{ label: 'Arrivals today', value: data.arrivals.length }, { label: 'Departures due', value: data.departures.length }, { label: 'Occupied rooms', value: data.occupied }, { label: 'Out of service', value: data.unavailable }] as metric (metric.label)}
		<Card.Root
			><Card.Header
				><Card.Description>{metric.label}</Card.Description><Card.Title class="text-3xl"
					>{metric.value}</Card.Title
				></Card.Header
			></Card.Root
		>
	{/each}
</div>
<div class="grid gap-6 lg:grid-cols-2">
	<Card.Root
		><Card.Header
			><Card.Title>Arrivals today</Card.Title><Card.Description
				>Reservations ready for check-in</Card.Description
			></Card.Header
		><Card.Content>
			{#if data.arrivals.length}
				<Table.Root
					><Table.Header
						><Table.Row
							><Table.Head>Room</Table.Head><Table.Head>Primary guest</Table.Head><Table.Head
							></Table.Head></Table.Row
						></Table.Header
					><Table.Body>
						{#each data.arrivals as stay (stay.id)}<Table.Row
								><Table.Cell>{stay.room.name}</Table.Cell><Table.Cell
									>{stay.guests.find((member) => member.role === 'PRIMARY')?.guest.first_name ??
										'—'}</Table.Cell
								><Table.Cell
									><Button href={`/stays/${stay.id}`} variant="outline" size="sm">Open</Button
									></Table.Cell
								></Table.Row
							>{/each}
					</Table.Body></Table.Root
				>
			{:else}<p class="text-sm text-muted-foreground">No arrivals scheduled today.</p>{/if}
		</Card.Content></Card.Root
	>
	<Card.Root
		><Card.Header
			><Card.Title>Departures due</Card.Title><Card.Description
				>Checked-in stays due today or overdue</Card.Description
			></Card.Header
		><Card.Content>
			{#if data.departures.length}
				<Table.Root
					><Table.Header
						><Table.Row
							><Table.Head>Room</Table.Head><Table.Head>Primary guest</Table.Head></Table.Row
						></Table.Header
					><Table.Body>
						{#each data.departures as stay (stay.id)}<Table.Row
								><Table.Cell
									><a class="underline" href={resolve('/stays/[id]', { id: stay.id })}
										>{stay.room.name}</a
									></Table.Cell
								><Table.Cell
									>{stay.guests.find((member) => member.role === 'PRIMARY')?.guest.first_name ??
										'—'}</Table.Cell
								></Table.Row
							>{/each}
					</Table.Body></Table.Root
				>
			{:else}<p class="text-sm text-muted-foreground">No departures due.</p>{/if}
		</Card.Content></Card.Root
	>
</div>
