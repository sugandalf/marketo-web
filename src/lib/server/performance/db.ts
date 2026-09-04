import { Database } from 'bun:sqlite';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../db/schema';

export type PerformanceDb = BunSQLiteDatabase<typeof schema>;

export type PerformanceStore = {
	db: PerformanceDb;
	close: () => void;
};

export function openPerformanceDb(databaseUrl: string): PerformanceStore {
	const client = new Database(databaseUrl, { create: true });
	client.run('PRAGMA journal_mode = WAL');
	return {
		db: drizzle(client, { schema }),
		close: () => client.close()
	};
}
