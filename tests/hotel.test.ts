import { test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('reservation, occupancy, membership, and room availability workflow', async () => {
	const temp = mkdtempSync(join(tmpdir(), 'hotel-desk-'));
	const file = join(temp, 'hotel.db');
	const migration = readdirSync('prisma/migrations').find((name) => name.endsWith('_init_hotel'));
	if (!migration) throw new Error('Initial migration is missing');
	const sqlite = new Database(file);
	sqlite.exec(readFileSync(join('prisma/migrations', migration, 'migration.sql'), 'utf8'));
	sqlite.close();
	process.env.DATABASE_URL = `file:${file}`;

	const hotel = await import('../src/lib/server/hotel');
	const { db } = await import('../src/lib/server/db');
	const guestInput = (first_name: string) => ({
		first_name,
		middle_name: '',
		last_name: 'Test',
		dob: '',
		sex: '',
		phone: '',
		email: ''
	});
	const primary = await hotel.saveGuest(guestInput('Ava'));
	const additional = await hotel.saveGuest(guestInput('Ben'));
	const room = await hotel.saveRoom({
		name: '101',
		room_type: 'Double',
		max_occupant: 2,
		is_out_of_service: false
	});
	const today = hotel.todayInput();
	const tomorrow = new Date(hotel.hotelDate(today).getTime() + 86_400_000)
		.toISOString()
		.slice(0, 10);
	const dayAfter = new Date(hotel.hotelDate(today).getTime() + 172_800_000)
		.toISOString()
		.slice(0, 10);
	const thirdDay = new Date(hotel.hotelDate(today).getTime() + 259_200_000)
		.toISOString()
		.slice(0, 10);
	await expect(
		hotel.createStay({
			room_id: room.id,
			arrival_date: today,
			departure_date: tomorrow,
			primary_guest_id: primary.id,
			guest_ids: [primary.id, additional.id, 'third']
		})
	).rejects.toThrow('capacity');

	const first = await hotel.createStay({
		room_id: room.id,
		arrival_date: today,
		departure_date: tomorrow,
		primary_guest_id: primary.id,
		guest_ids: [primary.id]
	});
	const adjacent = await hotel.createStay({
		room_id: room.id,
		arrival_date: tomorrow,
		departure_date: dayAfter,
		primary_guest_id: primary.id,
		guest_ids: [primary.id]
	});
	expect(adjacent.status).toBe('RESERVED');
	await expect(
		hotel.createStay({
			room_id: room.id,
			arrival_date: today,
			departure_date: tomorrow,
			primary_guest_id: primary.id,
			guest_ids: [primary.id]
		})
	).rejects.toThrow('unavailable');
	await expect(
		hotel.saveRoom(
			{ name: '101', room_type: 'Double', max_occupant: 2, is_out_of_service: true },
			room.id
		)
	).rejects.toThrow('Resolve open stays');

	await hotel.transitionStay(first.id, 'checkin');
	const future = await hotel.createStay({
		room_id: room.id,
		arrival_date: dayAfter,
		departure_date: thirdDay,
		primary_guest_id: primary.id,
		guest_ids: [primary.id]
	});
	const member = await hotel.addMember(first.id, additional.id);
	const firstMember = await db.stayGuest.findFirstOrThrow({
		where: { stay_id: first.id, role: 'PRIMARY' }
	});
	await hotel.removeMember(first.id, firstMember.id, member.id);
	const rejoined = await hotel.addMember(first.id, primary.id);
	expect(rejoined.id).not.toBe(firstMember.id);
	await hotel.transitionStay(first.id, 'checkout');
	await expect(hotel.addMember(first.id, primary.id)).rejects.toThrow('cannot be changed');
	await hotel.transitionStay(adjacent.id, 'cancel');
	await hotel.transitionStay(future.id, 'cancel');
	const walkIn = await hotel.createStay({
		room_id: room.id,
		arrival_date: today,
		departure_date: tomorrow,
		primary_guest_id: additional.id,
		guest_ids: [additional.id],
		walk_in: true
	});
	expect(walkIn.status).toBe('CHECKED_IN');
	await hotel.transitionStay(walkIn.id, 'checkout');
	await hotel.saveRoom(
		{ name: '101', room_type: 'Double', max_occupant: 2, is_out_of_service: true },
		room.id
	);
	expect(await hotel.availableRooms(today, tomorrow)).toHaveLength(0);
	await db.$disconnect();
});
