import bunAdapter from '@sveltejs/adapter-bun';
import type { Adapter, Builder } from '@sveltejs/kit';

type BunAdapterOptions = NonNullable<Parameters<typeof bunAdapter>[0]>;

/**
 * @sveltejs/adapter-bun 1.0.0-next.1 reads Kit 3 `builder.config.paths` /
 * `builder.config.outDir`. Kit 2.70 keeps those under `builder.config.kit`.
 */
export default function adapter(options?: BunAdapterOptions): Adapter {
	const inner = bunAdapter(options);
	return {
		name: inner.name,
		supports: inner.supports,
		emulate: inner.emulate,
		adapt(builder: Builder) {
			const kit = builder.config.kit;
			const config = new Proxy(builder.config, {
				get(target, prop, receiver) {
					if (prop === 'paths') return kit.paths;
					if (prop === 'outDir') return kit.outDir;
					return Reflect.get(target, prop, receiver);
				}
			});
			const proxied = new Proxy(builder, {
				get(target, prop, receiver) {
					if (prop === 'config') return config;
					return Reflect.get(target, prop, receiver);
				}
			});
			return inner.adapt(proxied);
		}
	};
}
