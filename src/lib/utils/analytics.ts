export function initGa({ disableAutoPageView = false, clientId = undefined }) {
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
		window.dataLayer!.push(arguments);
	};

	window.gtag('js', new Date());

	// Deny GA cookies
	window.gtag('consent', 'default', {
		ad_storage: 'denied',
		analytics_storage: 'denied'
	});

	window.gtag('config', gaId, {
		send_page_view: !disableAutoPageView, // enable or disable automatic page view tracking
		anonymize_ip: true, // anonymize IP for privacy
		client_id: clientId ?? getTempClientId() // use clientId if provided, otherwise generate a temporary clientId
	});

	// Load GA script
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
	document.head.appendChild(script);
}

/**
 * Generate a temporary clientId
 * @returns a temporary clientId
 */
export function getTempClientId() {
	try {
		const id = localStorage.getItem('temp_client_id');
		if (id) {
			return id;
		}

		const tempClientId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
		localStorage.setItem('temp_client_id', tempClientId);
		return tempClientId;
	} catch (error) {
		console.error('Error getting temp client id', error);
		return undefined;
	}
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
