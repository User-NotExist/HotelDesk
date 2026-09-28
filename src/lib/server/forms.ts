import { fail } from '@sveltejs/kit';
import { Prisma } from '../../../generated/prisma/client';
import { HotelError } from './hotel';

export function value(form: FormData, key: string) {
	return String(form.get(key) ?? '');
}

export function actionError(error: unknown) {
	if (error instanceof HotelError) return fail(400, { message: error.message });
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		['P2028', 'P2034'].includes(error.code)
	) {
		return fail(409, { message: 'Another staff action changed the database. Please try again.' });
	}
	throw error;
}
