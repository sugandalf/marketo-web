/// <reference types="bun-types" />
/// <reference types="@sveltejs/adapter-bun" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// adapter-bun fills Platform.server
	}
}

export {};
