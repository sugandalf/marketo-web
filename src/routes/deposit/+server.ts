import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseDepositBody, persistConfirmedDeposit, type PersistError } from '$lib/server/deposits';
import type { PersistDepositRequest } from '$lib/chain/depositRecord';

function isPersistError(value: PersistDepositRequest | PersistError): value is PersistError {
	return 'status' in value && 'message' in value;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = parseDepositBody(body);
	if (isPersistError(parsed)) {
		return json({ error: parsed.message }, { status: parsed.status });
	}

	const result = await persistConfirmedDeposit(parsed);
	if ('status' in result) {
		return json({ error: result.message }, { status: result.status });
	}
	return json({ ok: true, id: result.id });
};
