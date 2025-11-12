import { sha256 } from 'js-sha256';

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
	posthogTrack('signup_completed', {
		user_id: userIdHash,
		method: 'oauth',
		oauth_provider: provider,
		plan: 'free'
	});

	posthogIdentify(userIdHash, {
		plan: 'free',
		signup_date: new Date().toISOString(),
		oauth_provider: provider
	});
}

export function posthogEmailSignup(userId: string, email: string) {
	const userIdHash = sha256(userId);
	posthogTrack('signup_completed', {
		user_id: userIdHash,
		method: 'email',
		plan: 'free'
	});

	posthogIdentify(userIdHash, {
		email_hash: sha256(email.toLowerCase()),
		plan: 'free',
		signup_date: new Date().toISOString()
	});
}

export function posthogOauthLogin(userId: string, provider: string) {
	const userIdHash = sha256(userId);
	posthogTrack('login_completed', {
		user_id: userIdHash,
		method: 'oauth',
		plan: 'free',
		oauth_provider: provider
	});

	posthogIdentify(userIdHash);
}

export function posthogEmailLogin(userId: string) {
	const userIdHash = sha256(userId);
	posthogTrack('login_completed', {
		user_id: userIdHash,
		method: 'email',
		plan: 'free'
	});

	posthogIdentify(userIdHash);
}
