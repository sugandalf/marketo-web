export type OpenVaultPhase =
	| 'idle'
	| 'wrong_network'
	| 'approving'
	| 'pending'
	| 'confirmed'
	| 'rejected'
	| 'reverted'
	| 'rpc_error';

export type OpenVaultFailure = Extract<OpenVaultPhase, 'rejected' | 'reverted' | 'rpc_error'>;

export class OpenVaultError extends Error {
	readonly phase: OpenVaultFailure;

	constructor(phase: OpenVaultFailure, message?: string, options?: { cause?: unknown }) {
		super(message ?? phase, options);
		this.name = 'OpenVaultError';
		this.phase = phase;
	}
}

function errorName(error: unknown): string {
	if (!error || typeof error !== 'object') return '';
	if ('name' in error) return String(error.name);
	return '';
}

function errorCode(error: unknown): unknown {
	if (!error || typeof error !== 'object') return undefined;
	if ('code' in error) return error.code;
	return undefined;
}

function walkCauses(error: unknown): unknown[] {
	const seen: unknown[] = [];
	let current: unknown = error;
	while (current && typeof current === 'object' && seen.length < 8) {
		seen.push(current);
		if (!('cause' in current)) break;
		current = current.cause;
	}
	return seen;
}

export function classifyWriteError(error: unknown): OpenVaultFailure {
	if (error instanceof OpenVaultError) return error.phase;
	for (const node of walkCauses(error)) {
		const name = errorName(node);
		const code = errorCode(node);
		if (
			name === 'UserRejectedRequestError' ||
			code === 4001 ||
			code === 'ACTION_REJECTED' ||
			code === 5000
		) {
			return 'rejected';
		}
		if (
			name === 'ContractFunctionRevertedError' ||
			name === 'ContractFunctionExecutionError' ||
			name === 'TransactionExecutionError' ||
			name === 'CallExecutionError'
		) {
			return 'reverted';
		}
		if (typeof node === 'object' && node && 'shortMessage' in node) {
			const short = String(node.shortMessage).toLowerCase();
			if (short.includes('user rejected') || short.includes('denied')) return 'rejected';
			if (
				short.includes('revert') ||
				short.includes('operatorexists') ||
				short.includes('invalidamount') ||
				short.includes('depositcapexceeded')
			) {
				return 'reverted';
			}
		}
	}
	return 'rpc_error';
}
