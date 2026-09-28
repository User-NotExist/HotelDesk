import { redirect } from '@sveltejs/kit';
import { actionError, value } from '$lib/server/forms';
import { saveGuest } from '$lib/server/hotel';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		try {
			const guest = await saveGuest({
				first_name: value(form, 'first_name'),
				middle_name: value(form, 'middle_name'),
				last_name: value(form, 'last_name'),
				dob: value(form, 'dob'),
				sex: value(form, 'sex'),
				phone: value(form, 'phone'),
				email: value(form, 'email')
			});
			redirect(303, `/guests/${guest.id}`);
		} catch (error) {
			return actionError(error);
		}
	}
} satisfies Actions;
