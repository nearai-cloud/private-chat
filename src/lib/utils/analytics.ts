export function initGa(disableAutoPageView = false) {
	const gaId = import.meta.env.VITE_GA_ID;

	if (!gaId) {
		console.warn('Google Analytics ID is not set.');
		return;
	}

	if (window.gtag) return;

	// Initialize data layer and gtag function
	window.dataLayer = window.dataLayer || [];
	window.gtag = function () {
		// eslint-disable-next-line prefer-rest-params
		console.log('gtag', arguments);
		// eslint-disable-next-line prefer-rest-params
		window.dataLayer!.push(arguments);
	};

	window.gtag('js', new Date());
	window.gtag('config', gaId, {
		send_page_view: !disableAutoPageView
	});

	// Load GA script
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
	document.head.appendChild(script);
}

/**
 * Configuration for selective page view tracking
 */
export const ANALYTICS_CONFIG = {
	// Routes that should use sanitized tracking instead of automatic GA tracking
	SENSITIVE_TRACKING_TITLE: {
		'/c/': 'Chat',
		'/s/': 'Share Chat',
		'/channels/': 'Channel',
		'/knowledge/': 'Knowledge'
	}
};

/**
 * Sanitize a given title based on the path
 * @param title - The title to sanitize
 * @param path - The path to check
 * @returns The sanitized title
 */
export function sanitizeTitle(title: string, path: string): string {
	const route = Object.keys(ANALYTICS_CONFIG.SENSITIVE_TRACKING_TITLE).find((route) =>
		path.includes(route)
	);
	if (route) {
		const name =
			ANALYTICS_CONFIG.SENSITIVE_TRACKING_TITLE[
				route as keyof typeof ANALYTICS_CONFIG.SENSITIVE_TRACKING_TITLE
			] ?? 'Unknown Page';
		if (name) {
			// Create a generic page title that doesn't expose sensitive information
			title = title.includes('|') ? name + ' | ' + title.split('|')[1]?.trim() : name;
		}
	}
	return title;
}

/**
 * Tracks page view with automatic detection of whether to use sanitized or default title
 *
 * @param pageTitle - The page title
 * @param pagePath - The page path
 */
export function trackPageView(pageTitle: string, pagePath: string) {
	if (!window.gtag) return;

	window.gtag('event', 'page_view', {
		page_title: sanitizeTitle(pageTitle, pagePath),
		page_location: window.location.origin + pagePath
	});
}
