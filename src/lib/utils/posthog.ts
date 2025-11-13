import { sha256 } from 'js-sha256';

export function initPosthog() {
	const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_ID;
	const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

	if (!POSTHOG_KEY || !POSTHOG_HOST) {
		console.warn('PostHog ID or Host is not set.');
		return;
	}

	if (typeof window.posthog === 'undefined') {
		console.warn('PostHog library is not loaded.');
		return;
	}
	window.posthog.init(POSTHOG_KEY, {
		api_host: POSTHOG_HOST,
		person_profiles: 'always',
		autocapture: false,
		capture_pageview: false,
		persistence: 'localStorage+cookie',
		cookie_expiration: 90,
		cross_subdomain_cookie: true,
		cookie_domain: '.near.ai',
		respect_dnt: true,
		opt_out_capturing_by_default: false,
		disable_session_recording: true,
		session_recording: {
			recordCanvas: false,
			recordCrossOriginIframes: false,
			maskAllInputs: true
		}
	});

	// Respect Global Privacy Control (required by our cookie policy)
	if ((window.navigator as any).globalPrivacyControl === true) {
		window.posthog.opt_out_capturing();
		console.log('GPC signal detected - PostHog tracking disabled');
	}
}

export function posthogReset() {
	try {
		if (typeof window.posthog === 'undefined') {
			console.warn('PostHog is not initialized.');
			return;
		}
		window.posthog.reset();
	} catch (error) {
		console.error('PostHog reset error:', error);
	}
}

export function posthogTrack(event: string, properties?: Record<string, any>) {
	try {
		if (typeof window.posthog === 'undefined') {
			console.warn('PostHog is not initialized.');
			return;
		}
		window.posthog.capture(event, properties);
	} catch (error) {
		console.error('PostHog tracking error:', error);
	}
}

export function posthogIdentify(userId: string, properties?: Record<string, any>) {
	try {
		if (typeof window.posthog === 'undefined') {
			console.warn('PostHog is not initialized.');
			return;
		}
		window.posthog.identify(sha256(userId), properties);
	} catch (error) {
		console.error('PostHog identify error:', error);
	}
}

export function posthogPageView() {
	posthogTrack('page_view', {
		page_url: window.location.href,
		page_path: window.location.pathname,
		page_title: document.title,
		referrer: document.referrer
	});
}

export function posthogSignupStarted() {
	posthogTrack('signup_started', {
		entry_point: 'anonymous_message_attempt',
		page_url: window.location.href
	});
}

export function posthogOauthSignup(userId: string, provider: string) {
	const userIdHash = sha256(userId);
	posthogIdentify(userIdHash, {
		plan: 'free',
		signup_date: new Date().toISOString(),
		oauth_provider: provider
	});
	posthogTrack('signup_completed', {
		user_id: userIdHash,
		method: 'oauth',
		oauth_provider: provider,
		plan: 'free'
	});
}

export function posthogEmailSignup(userId: string, email: string) {
	const userIdHash = sha256(userId);
	posthogIdentify(userIdHash, {
		email_hash: sha256(email.toLowerCase()),
		plan: 'free',
		signup_date: new Date().toISOString()
	});
	posthogTrack('signup_completed', {
		user_id: userIdHash,
		method: 'email',
		plan: 'free'
	});
}

export function posthogOauthLogin(userId: string, provider: string) {
	const userIdHash = sha256(userId);
	posthogIdentify(userIdHash);
	posthogTrack('login_completed', {
		user_id: userIdHash,
		method: 'oauth',
		plan: 'free',
		oauth_provider: provider
	});
}

export function posthogEmailLogin(userId: string) {
	const userIdHash = sha256(userId);
	posthogIdentify(userIdHash);
	posthogTrack('login_completed', {
		user_id: userIdHash,
		method: 'email',
		plan: 'free'
	});
}
