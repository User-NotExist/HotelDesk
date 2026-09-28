import { Prisma, StayGuestRole, StayStatus } from '../../../generated/prisma/client';
import { db } from './db';

export class HotelError extends Error {}

function required(value: string, label: string) {
	const trimmed = value.trim();
	if (!trimmed) throw new HotelError(`${label} is required.`);
	return trimmed;
}

function optional(value: string) {
	return value.trim() || null;
}

export function hotelDate(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HotelError('Enter a valid date.');
	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
		throw new HotelError('Enter a valid date.');
	}
	return date;
}

export function dateInput(value: Date) {
	return value.toISOString().slice(0, 10);
}

export function todayInput() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateRange(arrival: string, departure: string) {
	const start = hotelDate(arrival);
	const end = hotelDate(departure);
	if (end <= start) throw new HotelError('Departure must be after arrival.');
	return { start, end };
}

function positiveCapacity(value: number) {
	if (!Number.isInteger(value) || value < 1) throw new HotelError('Capacity must be at least 1.');
	return value;
}

function databaseError(error: unknown): never {
	if (error instanceof HotelError) throw error;
	if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
		throw new HotelError('This name is already in use.');
	}
	throw error;
}

export async function saveGuest(
	input: {
		first_name: string;
		middle_name: string;
		last_name: string;
		dob: string;
		sex: string;
		phone: string;
		email: string;
	},
	id?: string
) {
	const data = {
		first_name: required(input.first_name, 'First name'),
		middle_name: optional(input.middle_name),
		last_name: required(input.last_name, 'Last name'),
		dob: input.dob ? hotelDate(input.dob) : null,
		sex: optional(input.sex),
		phone: optional(input.phone),
		email: optional(input.email)
	};
	try {
		return id ? await db.guest.update({ where: { id }, data }) : await db.guest.create({ data });
	} catch (error) {
		databaseError(error);
	}
}

export async function saveRoom(
	input: { name: string; room_type: string; max_occupant: number; is_out_of_service: boolean },
	id?: string
) {
	const data = {
		name: required(input.name, 'Room name'),
		room_type: required(input.room_type, 'Room type'),
		max_occupant: positiveCapacity(input.max_occupant),
		is_out_of_service: input.is_out_of_service
	};
	try {
		return await db.$transaction(async (tx) => {
			if (id) {
				const room = await tx.room.findUnique({
					where: { id },
					include: {
						stays: {
							where: { status: { in: [StayStatus.RESERVED, StayStatus.CHECKED_IN] } },
							include: { guests: { where: { left_at: null } } }
						}
					}
				});
				if (!room) throw new HotelError('Room not found.');
				const open = room.stays;
				if (data.is_out_of_service && open.length)
					throw new HotelError('Resolve open stays before taking this room out of service.');
				if (open.some((stay) => stay.guests.length > data.max_occupant)) {
					throw new HotelError('Capacity is below an existing stay’s party size.');
				}
				return tx.room.update({ where: { id }, data });
			}
			return tx.room.create({ data });
		});
	} catch (error) {
		databaseError(error);
	}
}

type Tx = Prisma.TransactionClient;

async function available(tx: Tx, roomId: string, start: Date, end: Date, exceptId?: string) {
	const room = await tx.room.findUnique({ where: { id: roomId } });
	if (!room) throw new HotelError('Room not found.');
	if (room.is_out_of_service) throw new HotelError('Room is out of service.');
	const conflict = await tx.stay.findFirst({
		where: {
			room_id: roomId,
			id: exceptId ? { not: exceptId } : undefined,
			status: { in: [StayStatus.RESERVED, StayStatus.CHECKED_IN] },
			OR: [
				{ arrival_date: { lt: end }, departure_date: { gt: start } },
				{ status: StayStatus.CHECKED_IN, departure_date: { lte: hotelDate(todayInput()) } }
			]
		}
	});
	if (conflict) throw new HotelError('Room is unavailable for these dates.');
	return room;
}

export async function availableRooms(arrival: string, departure: string) {
	const { start, end } = dateRange(arrival, departure);
	if (start < hotelDate(todayInput())) throw new HotelError('Arrival cannot be in the past.');
	const rooms = await db.room.findMany({
		where: { is_out_of_service: false },
		orderBy: { name: 'asc' }
	});
	const blocked = await db.stay.findMany({
		where: {
			status: { in: [StayStatus.RESERVED, StayStatus.CHECKED_IN] },
			OR: [
				{ arrival_date: { lt: end }, departure_date: { gt: start } },
				{ status: StayStatus.CHECKED_IN, departure_date: { lte: hotelDate(todayInput()) } }
			]
		},
		select: { room_id: true }
	});
	const blockedIds = new Set(blocked.map((stay) => stay.room_id));
	return rooms.filter((room) => !blockedIds.has(room.id));
}

export async function createStay(input: {
	room_id: string;
	arrival_date: string;
	departure_date: string;
	primary_guest_id: string;
	guest_ids: string[];
	walk_in?: boolean;
}) {
	const { start, end } = dateRange(input.arrival_date, input.departure_date);
	if (start < hotelDate(todayInput())) throw new HotelError('Arrival cannot be in the past.');
	const guestIds = [...new Set(input.guest_ids.filter(Boolean))];
	if (!input.primary_guest_id || !guestIds.includes(input.primary_guest_id))
		throw new HotelError('Choose one primary guest.');
	if (input.walk_in && input.arrival_date !== todayInput())
		throw new HotelError('Walk-ins must start today.');
	return db.$transaction(async (tx) => {
		const room = await available(tx, input.room_id, start, end);
		if (guestIds.length > room.max_occupant) throw new HotelError('Party exceeds room capacity.');
		const count = await tx.guest.count({ where: { id: { in: guestIds } } });
		if (count !== guestIds.length) throw new HotelError('One or more guests were not found.');
		return tx.stay.create({
			data: {
				room_id: room.id,
				arrival_date: start,
				departure_date: end,
				status: input.walk_in ? StayStatus.CHECKED_IN : StayStatus.RESERVED,
				checked_in_at: input.walk_in ? new Date() : null,
				guests: {
					create: guestIds.map((guest_id) => ({
						guest_id,
						role:
							guest_id === input.primary_guest_id ? StayGuestRole.PRIMARY : StayGuestRole.ADDITIONAL
					}))
				}
			}
		});
	});
}

export async function updateReservation(
	id: string,
	roomId: string,
	arrival: string,
	departure: string
) {
	const { start, end } = dateRange(arrival, departure);
	if (start < hotelDate(todayInput())) throw new HotelError('Arrival cannot be in the past.');
	return db.$transaction(async (tx) => {
		const stay = await tx.stay.findUnique({ where: { id }, include: { guests: true } });
		if (!stay || stay.status !== StayStatus.RESERVED)
			throw new HotelError('Only reservations can be edited.');
		const room = await available(tx, roomId, start, end, id);
		if (stay.guests.filter((member) => !member.left_at).length > room.max_occupant)
			throw new HotelError('Party exceeds room capacity.');
		return tx.stay.update({
			where: { id },
			data: { room_id: roomId, arrival_date: start, departure_date: end }
		});
	});
}

export async function transitionStay(id: string, action: 'checkin' | 'checkout' | 'cancel') {
	return db.$transaction(async (tx) => {
		const stay = await tx.stay.findUnique({ where: { id }, include: { guests: true } });
		if (!stay) throw new HotelError('Stay not found.');
		if (action === 'checkin') {
			if (stay.status !== StayStatus.RESERVED)
				throw new HotelError('Only reservations can be checked in.');
			if (dateInput(stay.arrival_date) > todayInput())
				throw new HotelError('Arrival date is in the future.');
			if (dateInput(stay.departure_date) <= todayInput())
				throw new HotelError('Update the departure date before checking in.');
			if (!stay.guests.some((guest) => guest.role === StayGuestRole.PRIMARY && !guest.left_at))
				throw new HotelError('A primary guest is required.');
			await available(tx, stay.room_id, stay.arrival_date, stay.departure_date, id);
			const occupied = await tx.stay.count({
				where: { room_id: stay.room_id, status: StayStatus.CHECKED_IN, id: { not: id } }
			});
			if (occupied) throw new HotelError('Room is already occupied.');
			const room = await tx.room.findUniqueOrThrow({ where: { id: stay.room_id } });
			if (room.is_out_of_service) throw new HotelError('Room is out of service.');
			return tx.stay.update({
				where: { id },
				data: { status: StayStatus.CHECKED_IN, checked_in_at: new Date() }
			});
		}
		if (action === 'checkout') {
			if (stay.status !== StayStatus.CHECKED_IN)
				throw new HotelError('Only checked-in stays can be checked out.');
			return tx.stay.update({
				where: { id },
				data: { status: StayStatus.CHECKED_OUT, checked_out_at: new Date() }
			});
		}
		if (stay.status !== StayStatus.RESERVED)
			throw new HotelError('Only reservations can be cancelled.');
		return tx.stay.update({ where: { id }, data: { status: StayStatus.CANCELLED } });
	});
}

export async function addMember(stayId: string, guestId: string) {
	return db.$transaction(async (tx) => {
		const stay = await tx.stay.findUnique({
			where: { id: stayId },
			include: { room: true, guests: true }
		});
		if (!stay || (stay.status !== StayStatus.RESERVED && stay.status !== StayStatus.CHECKED_IN))
			throw new HotelError('This stay cannot be changed.');
		if (stay.guests.some((member) => member.guest_id === guestId && !member.left_at))
			throw new HotelError('Guest is already in this stay.');
		if (stay.guests.filter((member) => !member.left_at).length >= stay.room.max_occupant)
			throw new HotelError('Room is at capacity.');
		if (!(await tx.guest.findUnique({ where: { id: guestId } })))
			throw new HotelError('Guest not found.');
		return tx.stayGuest.create({ data: { stay_id: stayId, guest_id: guestId } });
	});
}

export async function removeMember(stayId: string, memberId: string, replacementId?: string) {
	return db.$transaction(async (tx) => {
		const stay = await tx.stay.findUnique({ where: { id: stayId } });
		if (!stay || (stay.status !== StayStatus.RESERVED && stay.status !== StayStatus.CHECKED_IN))
			throw new HotelError('This stay cannot be changed.');
		const member = await tx.stayGuest.findUnique({ where: { id: memberId } });
		if (!member || member.stay_id !== stayId || member.left_at)
			throw new HotelError('Member not found.');
		if (member.role === StayGuestRole.PRIMARY) {
			if (!replacementId) throw new HotelError('Choose a replacement primary guest first.');
			const replacement = await tx.stayGuest.findUnique({ where: { id: replacementId } });
			if (
				!replacement ||
				replacement.stay_id !== stayId ||
				replacement.left_at ||
				replacement.id === memberId
			)
				throw new HotelError('Replacement must be a current member.');
			await tx.stayGuest.update({
				where: { id: replacementId },
				data: { role: StayGuestRole.PRIMARY }
			});
		}
		return tx.stayGuest.update({ where: { id: memberId }, data: { left_at: new Date() } });
	});
}
