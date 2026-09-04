import type { PageServerLoad } from './$types';
import { loadField } from '$lib/server/roster';

export const load: PageServerLoad = async () => {
	return loadField();
};
