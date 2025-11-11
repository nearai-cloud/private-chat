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
		window.posthog.identify(userId, properties);
	} catch (error) {
		console.error('PostHog identify error:', error);
	}
}

export function posthogPageView() {
	// console.log('PostHog page view tracked', window.location.href);
	posthogTrack('page_view', {
		page_url: window.location.href,
		page_path: window.location.pathname,
		page_title: document.title,
		referrer: document.referrer
	});
}

export function posthogSignupStarted() {
	console.log('PostHog signup started tracked', window.location.href);
	posthogTrack('signup_started', {
		entry_point: 'anonymous_message_attempt',
		page_url: window.location.href
	});
}

export function posthogOauthSignup(userId: string, provider: string) {
	console.log('PostHog oauth signup tracked', userId, provider);
	posthogTrack('signup_completed', {
		user_id: userId,
		method: 'oauth',
		oauth_provider: provider,
		plan: 'free'
	});

	posthogIdentify(userId, {
		plan: 'free',
		signup_date: new Date().toISOString(),
		oauth_provider: provider
	});
}

export function posthogEmailSignup(userId: string, email: string) {
	console.log('PostHog email signup tracked', userId, email);
	posthogTrack('signup_completed', {
		user_id: userId,
		method: 'email',
		plan: 'free'
	});

	posthogIdentify(userId, {
		email_hash: sha256(email.toLowerCase()),
		plan: 'free',
		signup_date: new Date().toISOString()
	});
}

export function posthogOauthLogin(userId: string, provider: string) {
	console.log('PostHog oauth login tracked', userId, provider);
	posthogTrack('login_completed', {
		user_id: userId,
		method: 'oauth',
		plan: 'free',
		oauth_provider: provider
	});

	posthogIdentify(userId);
}

export function posthogEmailLogin(userId: string) {
	console.log('PostHog email login tracked', userId);
	posthogTrack('login_completed', {
		user_id: userId,
		method: 'email',
		plan: 'free'
	});

	posthogIdentify(userId);
}
