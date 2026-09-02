import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parsePersistBody, persistConfirmedBot, type PersistError } from '$lib/server/bots';
import type { PersistBotRequest } from '$lib/chain/botRecord';

function isPersistError(value: PersistBotRequest | PersistError): value is PersistError {
	return 'status' in value && 'message' in value;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = parsePersistBody(body);
	if (isPersistError(parsed)) {
		return json({ error: parsed.message }, { status: parsed.status });
	}

	const result = await persistConfirmedBot(parsed);
	if ('status' in result) {
		return json({ error: result.message }, { status: result.status });
	}
	return json({ ok: true, id: result.id });
};
