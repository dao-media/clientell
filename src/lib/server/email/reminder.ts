import { getPortalUrl } from '$lib/server/config';
import { sendOutboundEmail, type SendResult as ReminderResult } from './send';

export type { ReminderResult };

async function sendEmail(
	platform: App.Platform | undefined,
	message: { to: string; subject: string; html: string; text: string }
): Promise<ReminderResult> {
	return sendOutboundEmail(platform, message);
}

export async function sendBriefReminder(
	platform: App.Platform | undefined,
	params: {
		to: string;
		contactName: string;
		briefTitle: string;
		progress: number;
	}
): Promise<ReminderResult> {
	const portalUrl = getPortalUrl(platform);
	const subject = `Reminder: complete your brief — ${params.briefTitle}`;
	const text = [
		`Hi ${params.contactName},`,
		'',
		`This is a friendly reminder to complete your brief "${params.briefTitle}".`,
		`Progress so far: ${params.progress}%.`,
		'',
		`Sign in at ${portalUrl} with your email and PIN.`,
		'',
		'— Briefly'
	].join('\n');
	const html = `
		<p>Hi ${params.contactName},</p>
		<p>This is a friendly reminder to complete your brief <strong>${params.briefTitle}</strong>.</p>
		<p>Progress so far: <strong>${params.progress}%</strong>.</p>
		<p><a href="${portalUrl}">Continue your brief</a> using your email and PIN.</p>
		<p>— Briefly</p>
	`;

	return sendEmail(platform, { to: params.to, subject, html, text });
}

export async function sendBriefReadyEmail(
	platform: App.Platform | undefined,
	params: {
		to: string;
		contactName: string;
		loginEmail: string;
		pin: string;
		categoriesLabel?: string;
	}
): Promise<ReminderResult> {
	const portalUrl = getPortalUrl(platform);
	const subject = 'Your information gathering link is ready';
	const categoriesLine = params.categoriesLabel
		? [`Categories: ${params.categoriesLabel}`, '']
		: [];
	const text = [
		`Hi ${params.contactName},`,
		'',
		'Your information gathering link is ready.',
		'',
		`Portal: ${portalUrl}`,
		'',
		'Sign in with:',
		`Email: ${params.loginEmail}`,
		`PIN: ${params.pin}`,
		'',
		'This is a one-time PIN. The first time you sign in, you will choose your own 6-digit PIN.',
		'Please save your new PIN after that — you will need it each time you access the questionnaire.',
		...categoriesLine,
		'— Briefly'
	].join('\n');
	const categoriesHtml = params.categoriesLabel
		? `<p>Categories: <strong>${params.categoriesLabel}</strong></p>`
		: '';
	const html = `
		<p>Hi ${params.contactName},</p>
		<p>Your information gathering link is ready.</p>
		<p><a href="${portalUrl}">${portalUrl}</a></p>
		<p><strong>Sign in with:</strong></p>
		<ul>
			<li>Email: <strong>${params.loginEmail}</strong></li>
			<li>PIN: <strong>${params.pin}</strong></li>
		</ul>
		<p>Please save your new PIN after that — you will need it each time you access the questionnaire.</p>
		<p><em>This email PIN is one-time. You will set your own PIN on first sign-in.</em></p>
		${categoriesHtml}
		<p>— Briefly</p>
	`;

	const result = await sendEmail(platform, { to: params.to, subject, html, text });
	if (result.ok && !result.simulated) {
		return { ...result, message: `Login details sent to ${params.to}.` };
	}
	return result;
}

export async function sendPortalLinkEmail(
	platform: App.Platform | undefined,
	params: {
		to: string;
		contactName: string;
		briefTitle: string;
	}
): Promise<ReminderResult> {
	const portalUrl = getPortalUrl(platform);
	const subject = `Your Briefly portal link — ${params.briefTitle}`;
	const text = [
		`Hi ${params.contactName},`,
		'',
		`Your brief "${params.briefTitle}" is ready.`,
		`Portal: ${portalUrl}`,
		'',
		'Sign in with your email and the PIN we shared separately.',
		'',
		'— Briefly'
	].join('\n');
	const html = `
		<p>Hi ${params.contactName},</p>
		<p>Your brief <strong>${params.briefTitle}</strong> is ready.</p>
		<p><a href="${portalUrl}">${portalUrl}</a></p>
		<p>Sign in with your email and the PIN we shared separately.</p>
		<p>— Briefly</p>
	`;

	return sendEmail(platform, { to: params.to, subject, html, text });
}

export async function sendForgotPinEmail(
	platform: App.Platform | undefined,
	params: {
		to: string;
		contactName: string;
		loginEmail: string;
		pin: string;
	}
): Promise<ReminderResult> {
	const portalUrl = getPortalUrl(platform);
	const subject = 'Your new Briefly sign-in PIN';
	const text = [
		`Hi ${params.contactName},`,
		'',
		'We received a request to reset your portal PIN.',
		'',
		`Portal: ${portalUrl}`,
		'',
		'Sign in with:',
		`Email: ${params.loginEmail}`,
		`Temporary PIN: ${params.pin}`,
		'',
		'This is a one-time PIN. The first time you sign in, you will choose your own 6-digit PIN.',
		'Please save your new PIN after that — you will need it each time you access the questionnaire.',
		'',
		'If you did not request this, contact your project manager.',
		'',
		'— Briefly'
	].join('\n');
	const html = `
		<p>Hi ${params.contactName},</p>
		<p>We received a request to reset your portal PIN.</p>
		<p><a href="${portalUrl}">${portalUrl}</a></p>
		<p><strong>Sign in with:</strong></p>
		<ul>
			<li>Email: <strong>${params.loginEmail}</strong></li>
			<li>Temporary PIN: <strong>${params.pin}</strong></li>
		</ul>
		<p><em>This PIN is one-time. You will set your own PIN on first sign-in.</em></p>
		<p>Please save your new PIN after that — you will need it each time you access the questionnaire.</p>
		<p>If you did not request this, contact your project manager.</p>
		<p>— Briefly</p>
	`;

	return sendEmail(platform, { to: params.to, subject, html, text });
}

export async function sendBriefSubmittedNotification(
	platform: App.Platform | undefined,
	params: {
		to: string;
		clientCompany: string;
		clientContact: string;
		briefTitle: string;
		submissionUrl: string;
	}
): Promise<ReminderResult> {
	const subject = `Brief completed — ${params.clientCompany}`;
	const text = [
		`${params.clientContact} at ${params.clientCompany} submitted their creative brief.`,
		`Brief: ${params.briefTitle}`,
		'',
		`Review it: ${params.submissionUrl}`,
		'',
		'— Briefly'
	].join('\n');
	const html = `
		<p><strong>${params.clientContact}</strong> at <strong>${params.clientCompany}</strong> submitted their creative brief.</p>
		<p>Brief: <strong>${params.briefTitle}</strong></p>
		<p><a href="${params.submissionUrl}">Open submission in Briefly</a></p>
		<p>— Briefly</p>
	`;

	return sendEmail(platform, { to: params.to, subject, html, text });
}
