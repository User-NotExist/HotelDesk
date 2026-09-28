import { db } from '$lib/server/db';
import { StayStatus } from '../../../generated/prisma/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? '';
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const where = Object.values(StayStatus).includes(status as StayStatus)
		? { status: status as StayStatus }
		: undefined;
	const [stays, total] = await Promise.all([
		db.stay.findMany({
			where,
			include: {
				room: true,
				guests: { where: { role: 'PRIMARY', left_at: null }, include: { guest: true } }
			},
			orderBy: [{ arrival_date: 'desc' }, { created_at: 'desc' }],
			skip: (page - 1) * 50,
			take: 50
		}),
		db.stay.count({ where })
	]);
	return { stays, status, page, total, pages: Math.max(1, Math.ceil(total / 50)) };
};
