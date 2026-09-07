import { Database } from 'bun:sqlite';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

export type AppDb = BunSQLiteDatabase<typeof schema>;

export type SqliteStore = {
	db: AppDb;
	close: () => void;
};

export function openSqlite(filename: string): SqliteStore {
	const client = new Database(filename, { create: true });
	client.run('PRAGMA journal_mode = WAL');
	return {
		db: drizzle(client, { schema }),
		close: () => client.close()
	};
}
