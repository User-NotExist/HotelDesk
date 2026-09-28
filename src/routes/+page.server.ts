import { db } from '$lib/server/db';
import { hotelDate, todayInput } from '$lib/server/hotel';
import { StayStatus } from '../../generated/prisma/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = todayInput();
	const tomorrow = new Date(hotelDate(today).getTime() + 86_400_000);
	const [arrivals, departures, occupied, unavailable] = await Promise.all([
		db.stay.findMany({
			where: { status: StayStatus.RESERVED, arrival_date: { gte: hotelDate(today), lt: tomorrow } },
			include: { room: true, guests: { include: { guest: true } } },
			orderBy: { arrival_date: 'asc' }
		}),
		db.stay.findMany({
			where: { status: StayStatus.CHECKED_IN, departure_date: { lte: tomorrow } },
			include: { room: true, guests: { include: { guest: true } } },
			orderBy: { departure_date: 'asc' }
		}),
		db.stay.count({ where: { status: StayStatus.CHECKED_IN } }),
		db.room.count({ where: { is_out_of_service: true } })
	]);
	return { arrivals, departures, occupied, unavailable, today };
};
