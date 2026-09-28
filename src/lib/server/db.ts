import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../../../generated/prisma/client';

const connectionUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const globalDb = globalThis as typeof globalThis & { hotelDb?: PrismaClient };

export const db =
	globalDb.hotelDb ?? new PrismaClient({ adapter: new PrismaLibSql({ url: connectionUrl }) });
if (process.env.NODE_ENV !== 'production') globalDb.hotelDb = db;
