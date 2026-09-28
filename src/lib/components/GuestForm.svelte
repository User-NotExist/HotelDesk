<script lang="ts">
	import type { Guest } from '../../../generated/prisma/client';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	let { guest, message }: { guest?: Guest; message?: string } = $props();
</script>

<Card.Root>
	<Card.Header
		><Card.Title>Guest details</Card.Title><Card.Description
			>Only first and last name are required.</Card.Description
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
						><Field.Label for="first_name">First name</Field.Label><Input
							id="first_name"
							name="first_name"
							value={guest?.first_name ?? ''}
							required
						/></Field.Field
					>
					<Field.Field
						><Field.Label for="last_name">Last name</Field.Label><Input
							id="last_name"
							name="last_name"
							value={guest?.last_name ?? ''}
							required
						/></Field.Field
					>
				</div>
				<Field.Field
					><Field.Label for="middle_name">Middle name</Field.Label><Input
						id="middle_name"
						name="middle_name"
						value={guest?.middle_name ?? ''}
					/></Field.Field
				>
				<div class="grid gap-4 sm:grid-cols-2">
					<Field.Field
						><Field.Label for="dob">Birth date</Field.Label><Input
							id="dob"
							name="dob"
							type="date"
							value={guest?.dob?.toISOString().slice(0, 10) ?? ''}
						/></Field.Field
					>
					<Field.Field
						><Field.Label for="sex">Sex</Field.Label><Input
							id="sex"
							name="sex"
							value={guest?.sex ?? ''}
						/></Field.Field
					>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<Field.Field
						><Field.Label for="phone">Phone</Field.Label><Input
							id="phone"
							name="phone"
							type="tel"
							value={guest?.phone ?? ''}
						/></Field.Field
					>
					<Field.Field
						><Field.Label for="email">Email</Field.Label><Input
							id="email"
							name="email"
							type="email"
							value={guest?.email ?? ''}
						/></Field.Field
					>
				</div>
			</Field.Group>
			<div><Button type="submit">Save guest</Button></div>
		</form>
	</Card.Content>
</Card.Root>
