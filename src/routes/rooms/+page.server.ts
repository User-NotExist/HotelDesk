import { db } from '$lib/server/db';
import { availableRooms, HotelError } from '$lib/server/hotel';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q')?.trim() ?? '';
	const arrival = url.searchParams.get('arrival') ?? '';
	const departure = url.searchParams.get('departure') ?? '';
	const rooms = await db.room.findMany({
		where: search
			? { OR: [{ name: { contains: search } }, { room_type: { contains: search } }] }
			: undefined,
		include: {
			stays: {
				where: { status: 'CHECKED_IN' },
				include: { guests: { where: { left_at: null }, include: { guest: true } } }
			}
		},
		orderBy: { name: 'asc' }
	});
	let availableIds: string[] | null = null;
	let message = '';
	if (arrival || departure) {
		try {
			availableIds = (await availableRooms(arrival, departure)).map((room) => room.id);
		} catch (error) {
			if (error instanceof HotelError) message = error.message;
			else throw error;
		}
	}
	return {
		rooms: availableIds ? rooms.filter((room) => availableIds.includes(room.id)) : rooms,
		search,
		arrival,
		departure,
		message
	};
};
