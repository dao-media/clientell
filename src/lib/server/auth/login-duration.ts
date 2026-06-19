import {
	DEFAULT_LOGIN_DURATION,
	LOGIN_DURATION_VALUES,
	type LoginDuration
} from '$lib/auth/login-duration';

export type { LoginDuration };

export function loginDurationFromForm(data: FormData): LoginDuration {
	const value = String(data.get('loginDuration') ?? DEFAULT_LOGIN_DURATION).trim();
	if ((LOGIN_DURATION_VALUES as readonly string[]).includes(value)) {
		return value as LoginDuration;
	}
	return DEFAULT_LOGIN_DURATION;
}

function secondsUntilEndOfUtcDay(): number {
	const now = new Date();
	const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
	return Math.max(60, Math.floor((end.getTime() - now.getTime()) / 1000));
}

export function sessionDurationSeconds(duration: LoginDuration): number {
	switch (duration) {
		case 'today':
			return secondsUntilEndOfUtcDay();
		case '7-days':
			return 60 * 60 * 24 * 7;
		case '2-weeks':
			return 60 * 60 * 24 * 14;
		case 'until-logout':
			return 60 * 60 * 24 * 365;
	}
}

export function sessionCookieMaxAge(duration: LoginDuration): number | null {
	if (duration === 'today') return null;
	return sessionDurationSeconds(duration);
}
