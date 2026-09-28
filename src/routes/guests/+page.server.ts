import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const where = search
		? {
				OR: [
					{ first_name: { contains: search } },
					{ last_name: { contains: search } },
					{ phone: { contains: search } },
					{ email: { contains: search } }
				]
			}
		: undefined;
	const [guests, total] = await Promise.all([
		db.guest.findMany({
			where,
			orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
			skip: (page - 1) * 50,
			take: 50
		}),
		db.guest.count({ where })
	]);
	return { guests, search, page, total, pages: Math.max(1, Math.ceil(total / 50)) };
};
