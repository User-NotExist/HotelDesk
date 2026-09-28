import { StayGuestRole, StayStatus } from '../generated/prisma/client';
import { db } from '../src/lib/server/db';

// All contacts use reserved example domains and fictional 555-01xx numbers.
const firstNames = [
	'Alex',
	'Bailey',
	'Casey',
	'Dana',
	'Emery',
	'Frankie',
	'Harper',
	'Jamie',
	'Kai',
	'Morgan',
	'Anika',
	'Arun',
	'Camila',
	'Daniel',
	'Elena',
	'Fatima',
	'Hana',
	'Isabel',
	'Jin',
	'Luca',
	'Mai',
	'Mateo',
	'Nadia',
	'Noah',
	'Olivia',
	'Priya',
	'Ravi',
	'Sofia',
	'Tariq',
	'Yuna'
];
const lastNames = [
	'Anderson',
	'Bennett',
	'Chen',
	'Davis',
	'Evans',
	'Garcia',
	'Hassan',
	'Ibrahim',
	'Kim',
	'Lee',
	'Ahmed',
	'Alvarez',
	'Bhandari',
	'Costa',
	'Dubois',
	'Fernandez',
	'Gupta',
	'Haddad',
	'Ito',
	'Khan',
	'Lim',
	'Moretti',
	'Nguyen',
	'Okafor',
	'Patel',
	'Rahman',
	'Sato',
	'Silva',
	'Tran',
	'Wong'
];
const DAY = 86_400_000;
const now = new Date();
const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
const date = (offset: number) => new Date(today.getTime() + offset * DAY);
const dayKey = today.toISOString().slice(0, 10);

const rooms = Array.from({ length: 50 }, (_, index) => {
	const number = (Math.floor(index / 10) + 1) * 100 + (index % 10) + 1;
	const position = (index % 10) + 1;
	const room_type =
		position === 10 ? 'Suite' : position >= 8 ? 'Twin' : position >= 5 ? 'Deluxe' : 'Standard';
	return {
		id: `sample-room-${number}`,
		name: String(number),
		room_type,
		max_occupant: room_type === 'Suite' ? 4 : 2,
		is_out_of_service: index >= 48
	};
});
const guests = Array.from({ length: 200 }, (_, index) => {
	const number = String(index + 1).padStart(3, '0');
	return {
		id: `sample-guest-${number}`,
		first_name: firstNames[index % 30],
		last_name: lastNames[(Math.floor(index / 30) * 7 + index * 11) % 30],
		dob: new Date(Date.UTC(1958 + ((index * 17) % 49), (index * 5) % 12, (index % 28) + 1)),
		sex: index % 12 === 0 ? null : index % 2 === 0 ? 'Female' : 'Male',
		phone:
			index % 9 === 0
				? null
				: `+1-${index < 100 ? '202' : '212'}-555-01${String(index % 100).padStart(2, '0')}`,
		email: `guest${number}@example.com`
	};
});

type SeedStay = {
	id: string;
	room_id: string;
	arrival_date: Date;
	departure_date: Date;
	status: StayStatus;
	checked_in_at: Date | null;
	checked_out_at: Date | null;
	created_at: Date;
	guestIds: string[];
};
function stay(
	roomIndex: number,
	label: string,
	arrival: number,
	nights: number,
	status: StayStatus
): SeedStay {
	const room = rooms[roomIndex];
	const guestIndex = (roomIndex * 13 + arrival * 7 + label.length * 19 + 20_000) % guests.length;
	const size = room.max_occupant === 4 && roomIndex % 3 === 0 ? 3 : roomIndex % 4 === 0 ? 2 : 1;
	const arrival_date = date(arrival);
	const departure_date = date(arrival + nights);
	return {
		id: `sample-stay-${dayKey}-${room.name}-${label}`,
		room_id: room.id,
		arrival_date,
		departure_date,
		status,
		checked_in_at: [StayStatus.CHECKED_IN, StayStatus.CHECKED_OUT].includes(status)
			? new Date(arrival_date.getTime() + 15 * 3_600_000 + (roomIndex % 5) * 900_000)
			: null,
		checked_out_at:
			status === StayStatus.CHECKED_OUT
				? new Date(departure_date.getTime() + 10 * 3_600_000 + (roomIndex % 4) * 900_000)
				: null,
		created_at: date(Math.min(arrival - 8, -1)),
		guestIds: Array.from(
			{ length: size },
			(_, index) => guests[(guestIndex + index) % guests.length].id
		)
	};
}
const planned: SeedStay[] = [];
for (let i = 0; i < 48; i++) {
	planned.push(stay(i, 'history-1', -75 + (i % 9), 2 + (i % 3), StayStatus.CHECKED_OUT));
	planned.push(stay(i, 'history-2', -43 + (i % 8), 2 + (i % 4), StayStatus.CHECKED_OUT));
	planned.push(stay(i, 'history-3', -17 + (i % 6), 2 + (i % 3), StayStatus.CHECKED_OUT));
	if (i < 30) planned.push(stay(i, 'in-house', -(i % 3), 4 + (i % 3), StayStatus.CHECKED_IN));
	else if (i < 38) planned.push(stay(i, 'arrival', 0, 2 + (i % 3), StayStatus.RESERVED));
	else planned.push(stay(i, 'upcoming', 2 + (i % 6), 2 + (i % 4), StayStatus.RESERVED));
	if (i < 12) planned.push(stay(i, 'later', 9 + (i % 4), 2 + (i % 3), StayStatus.RESERVED));
	if (i % 5 === 0) planned.push(stay(i, 'cancelled', 17 + (i % 4), 2, StayStatus.CANCELLED));
}

try {
	const result = await db.$transaction(
		async (tx) => {
			const currentRooms = await tx.room.findMany({ select: { id: true, name: true } });
			const names = new Set(currentRooms.map((room) => room.name));
			const ids = new Set(currentRooms.map((room) => room.id));
			const newRooms = rooms.filter((room) => !ids.has(room.id) && !names.has(room.name));
			if (newRooms.length) await tx.room.createMany({ data: newRooms });
			for (const room of rooms) {
				if (
					currentRooms.some((item) => item.id === room.id && item.name === `Demo ${room.name}`) &&
					!names.has(room.name)
				) {
					await tx.room.update({ where: { id: room.id }, data: { name: room.name } });
				}
			}
			for (const room of rooms.filter((item) => item.is_out_of_service)) {
				const active = await tx.stay.count({
					where: { room_id: room.id, status: { in: [StayStatus.RESERVED, StayStatus.CHECKED_IN] } }
				});
				if (!active && ids.has(room.id)) {
					await tx.room.update({ where: { id: room.id }, data: { is_out_of_service: true } });
				}
			}
			const currentGuests = new Set(
				(await tx.guest.findMany({ select: { id: true } })).map((guest) => guest.id)
			);
			const newGuests = guests.filter((guest) => !currentGuests.has(guest.id));
			if (newGuests.length) await tx.guest.createMany({ data: newGuests });
			const existing = await tx.stay.findMany({
				select: { id: true, room_id: true, arrival_date: true, departure_date: true, status: true }
			});
			const stayIds = new Set(existing.map((item) => item.id));
			const open = existing.filter((item) =>
				[StayStatus.RESERVED, StayStatus.CHECKED_IN].includes(item.status)
			);
			const actualRooms = new Set(
				(await tx.room.findMany({ select: { id: true } })).map((room) => room.id)
			);
			const serviceRooms = new Set(
				(await tx.room.findMany({ where: { is_out_of_service: false }, select: { id: true } })).map(
					(room) => room.id
				)
			);
			const selected: SeedStay[] = [];
			for (const item of planned) {
				if (stayIds.has(item.id) || !actualRooms.has(item.room_id)) continue;
				if ([StayStatus.RESERVED, StayStatus.CHECKED_IN].includes(item.status)) {
					if (!serviceRooms.has(item.room_id)) continue;
					const conflict = open.some(
						(other) =>
							other.room_id === item.room_id &&
							((other.status === StayStatus.CHECKED_IN && other.departure_date <= today) ||
								(other.arrival_date < item.departure_date &&
									other.departure_date > item.arrival_date))
					);
					if (conflict) continue;
					open.push(item);
				}
				selected.push(item);
			}
			if (selected.length) {
				await tx.stay.createMany({
					data: selected.map(({ guestIds, ...record }) => {
						if (!guestIds.length) throw new Error('A seeded stay needs a primary guest.');
						return record;
					})
				});
				await tx.stayGuest.createMany({
					data: selected.flatMap((item) =>
						item.guestIds.map((guest_id, index) => ({
							id: `${item.id}-guest-${index + 1}`,
							stay_id: item.id,
							guest_id,
							role: index === 0 ? StayGuestRole.PRIMARY : StayGuestRole.ADDITIONAL,
							joined_at: item.checked_in_at ?? item.created_at
						}))
					)
				});
			}
			return { rooms: newRooms.length, guests: newGuests.length, stays: selected.length };
		},
		{ timeout: 30_000 }
	);
	console.log(`Added ${result.rooms} rooms, ${result.guests} guests, and ${result.stays} stays.`);
} finally {
	await db.$disconnect();
}
