export const LOGIN_DURATION_VALUES = ['today', '7-days', '2-weeks', 'until-logout'] as const;

export type LoginDuration = (typeof LOGIN_DURATION_VALUES)[number];

export const DEFAULT_LOGIN_DURATION: LoginDuration = '7-days';

export const LOGIN_DURATION_OPTIONS: { value: LoginDuration; text: string }[] = [
	{ value: 'today', text: 'Today' },
	{ value: '7-days', text: '7 Days' },
	{ value: '2-weeks', text: '2 Weeks' },
	{ value: 'until-logout', text: 'Until I Log Out' }
];
