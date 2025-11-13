// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};

interface ImportMetaEnv {
	readonly VITE_GA_ID: string;
	readonly POSTHOG_ID: string;
	readonly POSTHOG_HOST: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare global {
	interface Window {
		gtag?: (...args: any[]) => void;
	}
}
