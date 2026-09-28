import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { saveRoom } from '$lib/server/hotel';
import { actionError, value } from '$lib/server/forms';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [room, currentStays] = await Promise.all([
		db.room.findUnique({
			where: { id: params.id },
			include: {
				stays: {
					include: { guests: { include: { guest: true } } },
					orderBy: { arrival_date: 'desc' },
					take: 30
				}
			}
		}),
		db.stay.findMany({
			where: { room_id: params.id, status: 'CHECKED_IN' },
			include: { guests: { where: { left_at: null }, include: { guest: true } } }
		})
	]);
	if (!room) error(404, 'Room not found');
	return { room, currentStays };
};

export const actions = {
	default: async ({ params, request }) => {
		const form = await request.formData();
		try {
			await saveRoom(
				{
					name: value(form, 'name'),
					room_type: value(form, 'room_type'),
					max_occupant: Number(value(form, 'max_occupant')),
					is_out_of_service: form.has('is_out_of_service')
				},
				params.id
			);
			redirect(303, `/rooms/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	}
} satisfies Actions;
