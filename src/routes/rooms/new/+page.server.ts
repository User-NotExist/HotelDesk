import { redirect } from '@sveltejs/kit';
import { saveRoom } from '$lib/server/hotel';
import { actionError, value } from '$lib/server/forms';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		try {
			const room = await saveRoom({
				name: value(form, 'name'),
				room_type: value(form, 'room_type'),
				max_occupant: Number(value(form, 'max_occupant')),
				is_out_of_service: form.has('is_out_of_service')
			});
			redirect(303, `/rooms/${room.id}`);
		} catch (error) {
			return actionError(error);
		}
	}
} satisfies Actions;
