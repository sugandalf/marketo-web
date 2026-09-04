export function log(message: string): void {
	console.log(`${new Date().toISOString()} ${message}`);
}

export function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message.split('\n')[0] ?? error.message;
	return String(error);
}
