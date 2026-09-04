import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	parseWithdrawBody,
	persistConfirmedWithdraw,
	type PersistError
} from '$lib/server/withdrawals';
import type { PersistWithdrawRequest } from '$lib/chain/withdrawRecord';

function isPersistError(value: PersistWithdrawRequest | PersistError): value is PersistError {
	return 'status' in value && 'message' in value;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = parseWithdrawBody(body);
	if (isPersistError(parsed)) {
		return json({ error: parsed.message }, { status: parsed.status });
	}

	const result = await persistConfirmedWithdraw(parsed);
	if ('status' in result) {
		return json({ error: result.message }, { status: result.status });
	}
	return json({ ok: true, id: result.id });
};
