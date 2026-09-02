import type { PersistBotRequest } from './botRecord';

export async function persistBot(body: PersistBotRequest): Promise<void> {
	const response = await fetch('', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		throw new Error(`persist failed: ${response.status}`);
	}
}
