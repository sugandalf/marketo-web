import { env } from '$env/dynamic/private';
import { openSqlite } from './sqlite';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db = openSqlite(env.DATABASE_URL).db;
