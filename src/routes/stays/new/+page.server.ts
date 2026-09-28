import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { actionError, value } from '$lib/server/forms';
import { availableRooms, createStay, todayInput } from '$lib/server/hotel';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const today = todayInput();
	const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000)
		.toISOString()
		.slice(0, 10);
	const [rooms, available, guests] = await Promise.all([
		db.room.findMany({ where: { is_out_of_service: false }, orderBy: { name: 'asc' } }),
		availableRooms(today, tomorrow),
		db.guest.findMany({ orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }] })
	]);
	return { rooms, availableRoomIds: available.map((room) => room.id), guests, today };
};

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		try {
			const stay = await createStay({
				room_id: value(form, 'room_id'),
				arrival_date: value(form, 'arrival_date'),
				departure_date: value(form, 'departure_date'),
				primary_guest_id: value(form, 'primary_guest_id'),
				guest_ids: [...form.getAll('guest_ids').map(String), value(form, 'primary_guest_id')],
				walk_in: form.has('walk_in')
			});
			redirect(303, `/stays/${stay.id}`);
		} catch (error) {
			return actionError(error);
		}
	}
} satisfies Actions;
