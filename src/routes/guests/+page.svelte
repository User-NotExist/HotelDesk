<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	let { data }: PageProps = $props();
	function pageHref(page: number) {
		return `/guests?page=${page}${data.search ? `&q=${encodeURIComponent(data.search)}` : ''}`;
	}
</script>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Guests</h1>
		<p class="text-muted-foreground">Guest contact details and stay history.</p>
	</div>
	<Button href="/guests/new">Add guest</Button>
</div>
<Card.Root
	><Card.Header><Card.Title>Find a guest</Card.Title></Card.Header><Card.Content
		><form method="GET" class="flex flex-wrap items-end gap-3">
			<Field.Group class="max-w-md flex-1"
				><Field.Field
					><Field.Label for="q">Name, phone, or email</Field.Label><Input
						id="q"
						name="q"
						value={data.search}
					/></Field.Field
				></Field.Group
			><Button type="submit">Search</Button>
		</form></Card.Content
	></Card.Root
>
<Card.Root
	><Card.Header
		><Card.Title>Guest list</Card.Title><Card.Description
			>{data.total} guests found</Card.Description
		></Card.Header
	><Card.Content>
		{#if data.guests.length}<Table.Root
				><Table.Header
					><Table.Row
						><Table.Head>Name</Table.Head><Table.Head>Phone</Table.Head><Table.Head
							>Email</Table.Head
						><Table.Head></Table.Head></Table.Row
					></Table.Header
				><Table.Body>
					{#each data.guests as guest (guest.id)}<Table.Row
							><Table.Cell class="font-medium">{guest.first_name} {guest.last_name}</Table.Cell
							><Table.Cell>{guest.phone ?? '—'}</Table.Cell><Table.Cell
								>{guest.email ?? '—'}</Table.Cell
							><Table.Cell
								><Button href={`/guests/${guest.id}`} variant="outline" size="sm">View</Button
								></Table.Cell
							></Table.Row
						>{/each}
				</Table.Body></Table.Root
			>{:else}<p class="text-sm text-muted-foreground">No guests match this search.</p>{/if}
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
