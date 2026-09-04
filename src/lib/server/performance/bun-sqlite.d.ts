declare module 'bun:sqlite' {
	export class Database {
		constructor(
			filename?: string,
			options?: { create?: boolean; readonly?: boolean; readwrite?: boolean }
		);
		run(sql: string, ...params: unknown[]): void;
		exec(sql: string): void;
		prepare(sql: string): unknown;
		transaction(fn: () => void): {
			deferred: () => void;
			immediate: () => void;
			exclusive: () => void;
		};
		close(): void;
	}
}
