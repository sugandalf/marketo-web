import { resolve } from '$app/paths';
import type { Pathname } from '$app/types';
import type { PersistBotRequest } from './botRecord';
import type { PersistDepositRequest } from './depositRecord';

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

export async function persistDeposit(body: PersistDepositRequest): Promise<void> {
	const response = await fetch(resolve('/deposit' as Pathname), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		throw new Error(`persist failed: ${response.status}`);
	}
}
