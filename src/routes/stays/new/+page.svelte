<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	let { data, form }: PageProps = $props();
	let primaryGuestSearch = $state('');
	let additionalGuestSearch = $state('');
	let primaryGuestId = $state('');
	let guestResultsOpen = $state(false);
	let guestSearchInput: HTMLInputElement | null = $state(null);
	let arrivalDate = $derived(data.today);
	let departureDate = $derived(
		new Date(Date.parse(`${data.today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
	);
	let availableRoomIds = $derived(data.availableRoomIds);
	let roomId = $state('');
	let checkingRooms = $state(false);
	let roomError = $state('');
	let availabilityRequest = 0;
	let availableRooms = $derived(data.rooms.filter((room) => availableRoomIds.includes(room.id)));
	let matchingPrimaryGuests = $derived(
		data.guests.filter((guest) => matchesGuest(guest, primaryGuestSearch))
	);
	let additionalGuestMatches = $derived(
		data.guests.some((guest) => matchesGuest(guest, additionalGuestSearch))
	);
	let nextDay = $derived(
		arrivalDate
			? new Date(Date.parse(`${arrivalDate}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
			: data.today
	);

	function matchesGuest(guest: (typeof data.guests)[number], search: string) {
		return `${guest.first_name} ${guest.last_name}`
			.toLocaleLowerCase()
			.includes(search.trim().toLocaleLowerCase());
	}

	function selectGuest(guest: (typeof data.guests)[number]) {
		primaryGuestId = guest.id;
		primaryGuestSearch = `${guest.first_name} ${guest.last_name}`;
		guestResultsOpen = false;
		guestSearchInput?.setCustomValidity('');
	}

	function searchGuests() {
		primaryGuestId = '';
		guestResultsOpen = true;
		guestSearchInput?.setCustomValidity('');
	}

	function validateGuest(event: SubmitEvent) {
		if (primaryGuestId) return;
		event.preventDefault();
		guestSearchInput?.setCustomValidity('Choose a guest from the search results.');
		guestSearchInput?.reportValidity();
		guestResultsOpen = true;
	}

	async function refreshRooms() {
		const request = ++availabilityRequest;
		availableRoomIds = [];
		roomId = '';
		roomError = '';
		if (!arrivalDate || !departureDate || departureDate <= arrivalDate) {
			checkingRooms = false;
			return;
		}
		checkingRooms = true;
		try {
			const url = new URL(resolve('/stays/new/available'), location.origin);
			url.searchParams.set('arrival', arrivalDate);
			url.searchParams.set('departure', departureDate);
			const response = await fetch(url);
			const result = await response.json();
			if (request !== availabilityRequest) return;
			if (!response.ok) throw new Error(result.message ?? 'Could not check room availability.');
			availableRoomIds = result.roomIds;
		} catch (error) {
			if (request === availabilityRequest)
				roomError = error instanceof Error ? error.message : 'Could not check room availability.';
		} finally {
			if (request === availabilityRequest) checkingRooms = false;
		}
	}
</script>

<div>
	<h1 class="text-3xl font-semibold tracking-tight">New reservation</h1>
	<p class="text-muted-foreground">
		Choose a room, dates, and at least one guest. Walk-ins check in immediately.
	</p>
</div>
<Card.Root
	><Card.Header
		><Card.Title>Stay details</Card.Title><Card.Description
			>Arrival is included; departure is the day the room becomes available.</Card.Description
		></Card.Header
	><Card.Content>
		{#if form?.message}<Alert.Root variant="destructive" class="mb-4"
				><Alert.Description>{form.message}</Alert.Description></Alert.Root
			>{/if}
		{#if !data.rooms.length || !data.guests.length}<Alert.Root
				><Alert.Description
					>Add at least one in-service room and one guest before creating a stay. <a
						href={resolve('/rooms/new')}
						class="underline">Add room</a
					>
					· <a href={resolve('/guests/new')} class="underline">Add guest</a></Alert.Description
				></Alert.Root
			>{/if}
		<form method="POST" class="mt-4 flex flex-col gap-6" onsubmit={validateGuest}>
			<Field.Group>
				<Field.Field
					><Field.Label for="room_id">Room</Field.Label><select
						id="room_id"
						name="room_id"
						required
						bind:value={roomId}
						disabled={checkingRooms || !availableRooms.length}
						class="h-9 rounded-md border border-input bg-background px-3 text-sm"
						><option value="">{checkingRooms ? 'Checking rooms…' : 'Choose room'}</option
						>{#each availableRooms as room (room.id)}<option value={room.id}
								>{room.name} · {room.room_type} · {room.max_occupant} guests</option
							>{/each}</select
					>{#if roomError}<Field.Description>{roomError}</Field.Description
						>{:else if !checkingRooms && !availableRooms.length}<Field.Description
							>No rooms available for these dates.</Field.Description
						>{/if}</Field.Field
				>
				<div class="grid gap-4 sm:grid-cols-2">
					<Field.Field
						><Field.Label for="arrival_date">Arrival</Field.Label><Input
							id="arrival_date"
							name="arrival_date"
							type="date"
							min={data.today}
							bind:value={arrivalDate}
							onchange={refreshRooms}
							required
						/></Field.Field
					><Field.Field
						><Field.Label for="departure_date">Departure</Field.Label><Input
							id="departure_date"
							name="departure_date"
							type="date"
							min={nextDay}
							bind:value={departureDate}
							onchange={refreshRooms}
							required
						/></Field.Field
					>
				</div>
				<Field.Field
					><Field.Label for="primary_guest_search">Primary guest</Field.Label>
					<div
						class="relative"
						onfocusout={(event) => {
							if (!event.currentTarget.contains(event.relatedTarget as Node | null))
								guestResultsOpen = false;
						}}
					>
						<Input
							id="primary_guest_search"
							type="search"
							role="combobox"
							aria-autocomplete="list"
							aria-expanded={guestResultsOpen}
							aria-controls="primary_guest_results"
							placeholder="Search guests by name"
							bind:value={primaryGuestSearch}
							bind:ref={guestSearchInput}
							required
							oninput={searchGuests}
							onfocus={() => (guestResultsOpen = true)}
							onkeydown={(event) => {
								if (event.key === 'Escape') guestResultsOpen = false;
								if (event.key === 'ArrowDown' && guestResultsOpen) {
									event.preventDefault();
									(
										document.querySelector(
											'#primary_guest_results button'
										) as HTMLButtonElement | null
									)?.focus();
								}
							}}
						/><input type="hidden" name="primary_guest_id" value={primaryGuestId} />
						{#if guestResultsOpen}<div
								id="primary_guest_results"
								role="listbox"
								aria-label="Matching guests"
								class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-input bg-background p-1 shadow-md"
							>
								{#each matchingPrimaryGuests as guest (guest.id)}<button
										type="button"
										role="option"
										aria-selected={guest.id === primaryGuestId}
										class="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
										onclick={() => selectGuest(guest)}>{guest.first_name} {guest.last_name}</button
									>{:else}<p class="px-3 py-2 text-sm text-muted-foreground">
										No guests found.
									</p>{/each}
							</div>{/if}
					</div>
					<Field.Description
						><a href={resolve('/guests/new')} class="underline">Add a new guest</a> first if needed.</Field.Description
					></Field.Field
				>
				<Field.Field
					><Field.Label for="additional_guest_search">Additional guests</Field.Label><Input
						id="additional_guest_search"
						type="search"
						placeholder="Search guests by name"
						bind:value={additionalGuestSearch}
					/>
					<div
						class="grid max-h-48 gap-3 overflow-y-auto rounded-md border border-input p-3 sm:grid-cols-2"
					>
						{#each data.guests as guest (guest.id)}<label
								class="flex items-center gap-2 text-sm"
								style:display={matchesGuest(guest, additionalGuestSearch) ? undefined : 'none'}
								><Checkbox name="guest_ids" value={guest.id} />{guest.first_name}
								{guest.last_name}</label
							>{/each}
						{#if !additionalGuestMatches}<p class="text-sm text-muted-foreground">
								No guests found.
							</p>{/if}
					</div></Field.Field
				>
				<Field.Field orientation="horizontal"
					><Checkbox id="walk_in" name="walk_in" /><Field.Label for="walk_in"
						>Walk-in: check in now</Field.Label
					></Field.Field
				>
			</Field.Group>
			<div>
				<Button
					type="submit"
					disabled={checkingRooms || !availableRooms.length || !data.guests.length}
					>Create stay</Button
				>
			</div>
		</form>
	</Card.Content></Card.Root
>
