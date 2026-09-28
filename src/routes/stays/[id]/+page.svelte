<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import * as Table from '$lib/components/ui/table';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	let { data, form }: PageProps = $props();
	let activeMembers = $derived(data.stay.guests.filter((member) => !member.left_at));
	function hotelTime(value: Date) {
		return new Intl.DateTimeFormat('en', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: data.timeZone
		}).format(value);
	}
</script>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<p class="text-sm text-muted-foreground">Stay in room {data.stay.room.name}</p>
		<h1 class="text-3xl font-semibold tracking-tight">
			{data.stay.arrival_date.toISOString().slice(0, 10)} to {data.stay.departure_date
				.toISOString()
				.slice(0, 10)}
		</h1>
		<Badge class="mt-2" variant="secondary">{data.stay.status.replaceAll('_', ' ')}</Badge>
	</div>
	<Button href="/stays" variant="outline">All stays</Button>
</div>
{#if form?.message}<Alert.Root variant="destructive"
		><Alert.Description>{form.message}</Alert.Description></Alert.Root
	>{/if}
<div class="flex flex-wrap gap-3">
	{#if data.stay.status === 'RESERVED'}
		<form method="POST" action="?/checkin"><Button type="submit">Check in</Button></form>
		<form id="cancel-stay" method="POST" action="?/cancel"></form>
		<AlertDialog.Root
			><AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}
				>Cancel reservation</AlertDialog.Trigger
			><AlertDialog.Content
				><AlertDialog.Header
					><AlertDialog.Title>Cancel this reservation?</AlertDialog.Title><AlertDialog.Description
						>The stay remains in history with a cancelled status.</AlertDialog.Description
					></AlertDialog.Header
				><AlertDialog.Footer
					><AlertDialog.Cancel>Keep reservation</AlertDialog.Cancel><AlertDialog.Action
						form="cancel-stay"
						type="submit"
						variant="destructive">Cancel reservation</AlertDialog.Action
					></AlertDialog.Footer
				></AlertDialog.Content
			></AlertDialog.Root
		>
	{:else if data.stay.status === 'CHECKED_IN'}
		<form id="checkout-stay" method="POST" action="?/checkout"></form>
		<AlertDialog.Root
			><AlertDialog.Trigger class={buttonVariants()}>Check out</AlertDialog.Trigger
			><AlertDialog.Content
				><AlertDialog.Header
					><AlertDialog.Title>Check out this stay?</AlertDialog.Title><AlertDialog.Description
						>This records the current time as checkout and frees the room.</AlertDialog.Description
					></AlertDialog.Header
				><AlertDialog.Footer
					><AlertDialog.Cancel>Go back</AlertDialog.Cancel><AlertDialog.Action
						form="checkout-stay"
						type="submit">Check out</AlertDialog.Action
					></AlertDialog.Footer
				></AlertDialog.Content
			></AlertDialog.Root
		>
	{/if}
</div>
<div class="grid gap-6 lg:grid-cols-2">
	<Card.Root
		><Card.Header
			><Card.Title>Stay details</Card.Title><Card.Description
				>Scheduled dates and actual times</Card.Description
			></Card.Header
		><Card.Content class="flex flex-col gap-4">
			<p class="text-sm">
				Checked in: {data.stay.checked_in_at ? hotelTime(data.stay.checked_in_at) : 'Not yet'}
			</p>
			<p class="text-sm">
				Checked out: {data.stay.checked_out_at ? hotelTime(data.stay.checked_out_at) : 'Not yet'}
			</p>
			{#if data.stay.status === 'RESERVED'}<form
					method="POST"
					action="?/update"
					class="flex flex-col gap-4"
				>
					<Field.Group
						><Field.Field
							><Field.Label for="room_id">Room</Field.Label><select
								id="room_id"
								name="room_id"
								class="h-9 rounded-md border border-input bg-background px-3 text-sm"
								>{#each data.rooms as room (room.id)}<option
										value={room.id}
										selected={room.id === data.stay.room_id}>{room.name}</option
									>{/each}</select
							></Field.Field
						>
						<div class="grid gap-4 sm:grid-cols-2">
							<Field.Field
								><Field.Label for="arrival_date">Arrival</Field.Label><Input
									id="arrival_date"
									name="arrival_date"
									type="date"
									value={data.stay.arrival_date.toISOString().slice(0, 10)}
									required
								/></Field.Field
							><Field.Field
								><Field.Label for="departure_date">Departure</Field.Label><Input
									id="departure_date"
									name="departure_date"
									type="date"
									value={data.stay.departure_date.toISOString().slice(0, 10)}
									required
								/></Field.Field
							>
						</div></Field.Group
					>
					<div><Button type="submit" variant="outline">Save reservation</Button></div>
				</form>{/if}
		</Card.Content></Card.Root
	>
	<Card.Root
		><Card.Header
			><Card.Title>Current members</Card.Title><Card.Description
				>{activeMembers.length} of {data.stay.room.max_occupant} places used</Card.Description
			></Card.Header
		><Card.Content class="flex flex-col gap-5">
			{#if activeMembers.length}<Table.Root
					><Table.Header
						><Table.Row
							><Table.Head>Guest</Table.Head><Table.Head>Role</Table.Head><Table.Head
							></Table.Head></Table.Row
						></Table.Header
					><Table.Body>
						{#each activeMembers as member (member.id)}<Table.Row
								><Table.Cell
									><a class="underline" href={resolve('/guests/[id]', { id: member.guest_id })}
										>{member.guest.first_name} {member.guest.last_name}</a
									></Table.Cell
								><Table.Cell><Badge variant="secondary">{member.role}</Badge></Table.Cell
								><Table.Cell>
									{#if data.stay.status === 'RESERVED' || data.stay.status === 'CHECKED_IN'}<form
											method="POST"
											action="?/removeMember"
											class="flex flex-wrap gap-2"
										>
											<input
												type="hidden"
												name="member_id"
												value={member.id}
											/>{#if member.role === 'PRIMARY'}<label
													class="sr-only"
													for={`replacement-${member.id}`}>Replacement primary guest</label
												><select
													id={`replacement-${member.id}`}
													name="replacement_id"
													required
													class="h-8 rounded-md border border-input bg-background px-2 text-xs"
													><option value="">Replace with</option
													>{#each activeMembers.filter((other) => other.id !== member.id) as other (other.id)}<option
															value={other.id}
															>{other.guest.first_name} {other.guest.last_name}</option
														>{/each}</select
												>{/if}<Button
												type="submit"
												size="sm"
												variant="destructive"
												disabled={member.role === 'PRIMARY' && activeMembers.length < 2}
												>Remove</Button
											>
										</form>{/if}
								</Table.Cell></Table.Row
							>{/each}
					</Table.Body></Table.Root
				>{:else}<p class="text-sm text-muted-foreground">No current members.</p>{/if}
			{#if data.stay.status === 'RESERVED' || data.stay.status === 'CHECKED_IN'}<form
					method="POST"
					action="?/addMember"
					class="flex flex-wrap items-end gap-3"
				>
					<Field.Group class="min-w-48 flex-1"
						><Field.Field
							><Field.Label for="guest_id">Add guest</Field.Label><select
								id="guest_id"
								name="guest_id"
								required
								class="h-9 rounded-md border border-input bg-background px-3 text-sm"
								><option value="">Choose guest</option
								>{#each data.guests.filter((guest) => !activeMembers.some((member) => member.guest_id === guest.id)) as guest (guest.id)}<option
										value={guest.id}>{guest.first_name} {guest.last_name}</option
									>{/each}</select
							></Field.Field
						></Field.Group
					><Button type="submit" variant="outline">Add member</Button>
				</form>{/if}
		</Card.Content></Card.Root
	>
</div>
<Card.Root
	><Card.Header><Card.Title>Membership history</Card.Title></Card.Header><Card.Content
		><div class="flex flex-col gap-2">
			{#each data.stay.guests as member (member.id)}<p class="text-sm">
					{member.guest.first_name}
					{member.guest.last_name} · {member.role} · added {hotelTime(
						member.joined_at
					)}{member.left_at ? ` · left ${hotelTime(member.left_at)}` : ''}
				</p>{/each}
		</div></Card.Content
	></Card.Root
>
