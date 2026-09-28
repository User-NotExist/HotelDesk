<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	let { data }: PageProps = $props();
</script>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Rooms</h1>
		<p class="text-muted-foreground">Search rooms and check date-range availability.</p>
	</div>
	<Button href="/rooms/new">Add room</Button>
</div>
<Card.Root
	><Card.Header><Card.Title>Find rooms</Card.Title></Card.Header><Card.Content>
		<form method="GET" class="flex flex-col gap-4">
			<Field.Group
				><div class="grid gap-4 md:grid-cols-3">
					<Field.Field
						><Field.Label for="q">Name or type</Field.Label><Input
							id="q"
							name="q"
							value={data.search}
							placeholder="Search rooms"
						/></Field.Field
					><Field.Field
						><Field.Label for="arrival">Arrival</Field.Label><Input
							id="arrival"
							name="arrival"
							type="date"
							value={data.arrival}
						/></Field.Field
					><Field.Field
						><Field.Label for="departure">Departure</Field.Label><Input
							id="departure"
							name="departure"
							type="date"
							value={data.departure}
						/></Field.Field
					>
				</div></Field.Group
			>
			<div><Button type="submit">Search</Button></div>
		</form>
		{#if data.message}<Alert.Root variant="destructive" class="mt-4"
				><Alert.Description>{data.message}</Alert.Description></Alert.Root
			>{/if}
	</Card.Content></Card.Root
>
<section aria-labelledby="room-list-title" class="flex flex-col gap-4">
	<div>
		<h2 id="room-list-title" class="text-xl font-semibold">Room list</h2>
		<p class="text-sm text-muted-foreground">{data.rooms.length} rooms shown</p>
	</div>
	{#if data.rooms.length}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each data.rooms as room (room.id)}
				<a
					href={resolve('/rooms/[id]', { id: room.id })}
					aria-label={`View room ${room.name}`}
					class="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					<Card.Root size="sm" class="h-full transition-shadow hover:shadow-md">
						<Card.Header>
							<Card.Title>{room.name}</Card.Title>
							<Card.Description>{room.room_type}</Card.Description>
							<Card.Action>
								<Badge
									variant={room.is_out_of_service
										? 'destructive'
										: room.stays.length
											? 'warning'
											: 'success'}
								>
									{room.is_out_of_service
										? 'Out of service'
										: room.stays.length
											? 'Occupied'
											: 'Ready'}
								</Badge>
							</Card.Action>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">Capacity: {room.max_occupant} guests</p>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">No rooms match this search.</p>
	{/if}
</section>
