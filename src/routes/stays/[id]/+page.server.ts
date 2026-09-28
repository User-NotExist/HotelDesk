import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { actionError, value } from '$lib/server/forms';
import { addMember, removeMember, transitionStay, updateReservation } from '$lib/server/hotel';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [stay, rooms, guests] = await Promise.all([
		db.stay.findUnique({
			where: { id: params.id },
			include: { room: true, guests: { include: { guest: true }, orderBy: { joined_at: 'asc' } } }
		}),
		db.room.findMany({ where: { is_out_of_service: false }, orderBy: { name: 'asc' } }),
		db.guest.findMany({ orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }] })
	]);
	if (!stay) error(404, 'Stay not found');
	return { stay, rooms, guests, timeZone: process.env.TZ ?? 'UTC' };
};

export const actions = {
	update: async ({ params, request }) => {
		const form = await request.formData();
		try {
			await updateReservation(
				params.id,
				value(form, 'room_id'),
				value(form, 'arrival_date'),
				value(form, 'departure_date')
			);
			redirect(303, `/stays/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	},
	checkin: async ({ params }) => {
		try {
			await transitionStay(params.id, 'checkin');
			redirect(303, `/stays/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	},
	checkout: async ({ params }) => {
		try {
			await transitionStay(params.id, 'checkout');
			redirect(303, `/stays/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	},
	cancel: async ({ params }) => {
		try {
			await transitionStay(params.id, 'cancel');
			redirect(303, `/stays/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	},
	addMember: async ({ params, request }) => {
		const form = await request.formData();
		try {
			await addMember(params.id, value(form, 'guest_id'));
			redirect(303, `/stays/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	},
	removeMember: async ({ params, request }) => {
		const form = await request.formData();
		try {
			await removeMember(
				params.id,
				value(form, 'member_id'),
				value(form, 'replacement_id') || undefined
			);
			redirect(303, `/stays/${params.id}`);
		} catch (error) {
			return actionError(error);
		}
	}
} satisfies Actions;
