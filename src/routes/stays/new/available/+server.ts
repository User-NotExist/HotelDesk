import { json } from '@sveltejs/kit';
import { availableRooms, HotelError } from '$lib/server/hotel';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const rooms = await availableRooms(
			url.searchParams.get('arrival') ?? '',
			url.searchParams.get('departure') ?? ''
		);
		return json({ roomIds: rooms.map((room) => room.id) });
	} catch (error) {
		if (error instanceof HotelError) return json({ message: error.message }, { status: 400 });
		throw error;
	}
};
