<script lang="ts">
	import type { Room } from '../../../generated/prisma/client';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	let { room, message }: { room?: Room; message?: string } = $props();
</script>

<Card.Root>
	<Card.Header
		><Card.Title>Room details</Card.Title><Card.Description
			>Set the room label, type, and maximum party size.</Card.Description
		></Card.Header
	>
	<Card.Content>
		{#if message}<Alert.Root variant="destructive" class="mb-4"
				><Alert.Description>{message}</Alert.Description></Alert.Root
			>{/if}
		<form method="POST" class="flex flex-col gap-6">
			<Field.Group>
				<div class="grid gap-4 sm:grid-cols-2">
					<Field.Field
						><Field.Label for="name">Room name</Field.Label><Input
							id="name"
							name="name"
							value={room?.name ?? ''}
							required
						/></Field.Field
					>
					<Field.Field
						><Field.Label for="room_type">Room type</Field.Label><Input
							id="room_type"
							name="room_type"
							value={room?.room_type ?? ''}
							required
						/></Field.Field
					>
				</div>
				<Field.Field
					><Field.Label for="max_occupant">Maximum occupants</Field.Label><Input
						id="max_occupant"
						name="max_occupant"
						type="number"
						min="1"
						step="1"
						value={room?.max_occupant ?? 2}
						required
					/></Field.Field
				>
				<Field.Field orientation="horizontal"
					><Checkbox
						id="is_out_of_service"
						name="is_out_of_service"
						checked={room?.is_out_of_service ?? false}
					/><Field.Label for="is_out_of_service">Out of service</Field.Label></Field.Field
				>
			</Field.Group>
			<div><Button type="submit">Save room</Button></div>
		</form>
	</Card.Content>
</Card.Root>
