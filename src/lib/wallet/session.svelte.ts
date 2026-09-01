import { browser } from '$app/environment';
	import {
		connect as wagmiConnect,
		disconnect as wagmiDisconnect,
		getConnection,
		getConnectors,
		hydrate,
		watchConnection,
		watchConnectors,
		ConnectorAlreadyConnectedError,
		type Connector,
		type GetConnectionReturnType
	} from '@wagmi/core';
	import { walletConfig } from './config';

export type ConnectErrorKind = 'rejected' | 'unavailable' | 'failed' | 'none';

function classifyConnectError(error: unknown): ConnectErrorKind {
	if (!error || typeof error !== 'object') return 'failed';
	const name = 'name' in error ? String(error.name) : '';
	const code = 'code' in error ? error.code : undefined;
	if (
		name === 'UserRejectedRequestError' ||
		code === 4001 ||
		code === 'ACTION_REJECTED'
	) {
		return 'rejected';
	}
	if (name === 'ResourceUnavailableRpcError' || code === -32002) {
		return 'unavailable';
	}
	return 'failed';
}

function rdnsKey(connector: Connector): string {
	const rdns = connector.rdns;
	if (!rdns) return connector.id;
	return (Array.isArray(rdns) ? [...rdns].sort() : [rdns]).join(',');
}

export function listedWallets(connectors: readonly Connector[]) {
	const announced = connectors.filter((connector) => Boolean(connector.rdns));
	if (announced.length) {
		const seen = new Set<string>();
		return announced.filter((connector) => {
			const key = rdnsKey(connector);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}
	return connectors.filter((connector) => connector.type === 'injected');
}

class WalletSession {
	address = $state<`0x${string}` | undefined>(undefined);
	status = $state<GetConnectionReturnType['status']>('disconnected');
	connectors = $state<Connector[]>([]);
	error = $state<ConnectErrorKind | null>(null);
	ready = $state(false);
	#started = false;

	connected = $derived(this.status === 'connected' && Boolean(this.address));
	pending = $derived(this.status === 'connecting' || this.status === 'reconnecting');
	wallets = $derived(listedWallets(this.connectors));

	start() {
		if (this.#started || !browser) return;
		this.#started = true;

		watchConnection(walletConfig, {
			onChange: (connection) => this.#sync(connection)
		});
		watchConnectors(walletConfig, {
			onChange: (next) => {
				this.connectors = [...next];
			}
		});
		this.connectors = [...getConnectors(walletConfig)];
		this.#sync(getConnection(walletConfig));

		const { onMount } = hydrate(walletConfig, { reconnectOnMount: true });
		void onMount().finally(() => {
			this.ready = true;
			this.#sync(getConnection(walletConfig));
			this.connectors = [...getConnectors(walletConfig)];
		});
	}

	#sync(connection: GetConnectionReturnType) {
		this.address = connection.address;
		this.status = connection.status;
		if (connection.status === 'connected') this.error = null;
	}

	async connect(connector?: Connector): Promise<'pick' | 'ok' | 'error'> {
		this.error = null;
		const target = connector ?? (this.wallets.length === 1 ? this.wallets[0] : undefined);
		if (!target) {
			if (this.wallets.length === 0) {
				this.error = 'none';
				return 'error';
			}
			return 'pick';
		}

		try {
			const provider = await target.getProvider();
			if (!provider) {
				this.error = 'none';
				this.#sync(getConnection(walletConfig));
				return 'error';
			}
			await wagmiConnect(walletConfig, { connector: target });
			this.#sync(getConnection(walletConfig));
			return this.connected ? 'ok' : 'error';
		} catch (error) {
			if (
				error instanceof ConnectorAlreadyConnectedError ||
				(error !== null &&
					typeof error === 'object' &&
					'name' in error &&
					error.name === 'ConnectorAlreadyConnectedError')
			) {
				this.#sync(getConnection(walletConfig));
				return 'ok';
			}
			this.error = classifyConnectError(error);
			this.#sync(getConnection(walletConfig));
			return 'error';
		}
	}

	async disconnect() {
		this.error = null;
		try {
			await wagmiDisconnect(walletConfig);
		} finally {
			this.#sync(getConnection(walletConfig));
		}
	}

	clearError() {
		this.error = null;
	}
}

export const wallet = new WalletSession();
