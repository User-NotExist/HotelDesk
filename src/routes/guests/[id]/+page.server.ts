import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { actionError, value } from '$lib/server/forms';
import { saveGuest } from '$lib/server/hotel';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const guest = await db.guest.findUnique({
		where: { id: params.id },
		include: {
			stays: { include: { stay: { include: { room: true } } }, orderBy: { joined_at: 'desc' } }
		}
	});
	if (!guest) error(404, 'Guest not found');
	return { guest };
};

export const actions = {
	default: async ({ params, request }) => {
		const form = await request.formData();
		try {
			await saveGuest(
				{
					first_name: value(form, 'first_name'),
					middle_name: value(form, 'middle_name'),
					last_name: value(form, 'last_name'),
					dob: value(form, 'dob'),
					sex: value(form, 'sex'),
					phone: value(form, 'phone'),
					email: value(form, 'email')
				},
				params.id
			);
			redirect(303, `/guests/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	}
} satisfies Actions;
