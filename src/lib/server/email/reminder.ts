import { getPublicOrigin } from '$lib/server/config';
import {
	buildClientEmail,
	firstLoginPinNote,
	portalSignInSteps
} from '$lib/server/email/templates';
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
	const siteUrl = getPublicOrigin(platform);
	const { subject, text, html } = buildClientEmail({
		subject: `Reminder: your Briefly brief — ${params.briefTitle}`,
		greetingName: params.contactName,
		intro: `Just a friendly reminder from Dane to finish your brief in Briefly. You're ${params.progress}% through "${params.briefTitle}". When you have a few minutes, follow these steps:`,
		steps: [
			...portalSignInSteps(siteUrl),
			'Sign in with your email address and PIN. (Be sure to select how long you\'d like to remain logged in.)',
			'Open your brief and continue where you left off.'
		]
	});

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
	const siteUrl = getPublicOrigin(platform);
	const pinNote = firstLoginPinNote();
	const categoriesSuffix = params.categoriesLabel
		? ` Categories for this brief: ${params.categoriesLabel}.`
		: '';

	const { subject, text, html } = buildClientEmail({
		subject: 'Your Briefly link is ready',
		greetingName: params.contactName,
		intro:
			"You are receiving this email so you can access Dane's brief-builder tool, Briefly. Below, you will find the tool login link and your one-time PIN number. To get logged in, follow these steps:",
		steps: [
			...portalSignInSteps(siteUrl),
			`Input your email address, ${params.loginEmail}, and temporary PIN ${params.pin}. (Be sure to select how long you'd like to remain logged in.)`,
			"Set your new PIN that you'll use for all future logins.",
			`Click the available brief and provide your answers to the best of your ability for each question.${categoriesSuffix}`
		],
		afterSteps: pinNote
	});

	const result = await sendEmail(platform, { to: params.to, subject, html, text });
	if (result.ok && !result.simulated) {
		return { ...result, message: `Login details sent to ${params.to}.` };
	}
	return result;
}

export async function sendBriefAccessHelpEmail(
	platform: App.Platform | undefined,
	params: {
		to: string;
		contactName: string;
		loginEmail: string;
		briefTitle: string;
	}
): Promise<ReminderResult> {
	const siteUrl = getPublicOrigin(platform);
	const { subject, text, html } = buildClientEmail({
		subject: 'Need help accessing Briefly?',
		greetingName: params.contactName,
		intro: `Need help accessing Briefly? Here is a reminder of how to sign in and open your brief, "${params.briefTitle}".`,
		steps: [
			...portalSignInSteps(siteUrl),
			`Sign in with your email address, ${params.loginEmail}, and the PIN you set during your first login. (Be sure to select how long you'd like to remain logged in.)`,
			'Click your available brief and continue your answers to the best of your ability.'
		],
		afterSteps: {
			text: 'If you forgot your PIN, use Forgot PIN on the sign-in page or email Dane at hello@daneoleary.com.',
			html: '<p>If you forgot your PIN, use <strong>Forgot PIN</strong> on the sign-in page or email Dane at <a href="mailto:hello@daneoleary.com">hello@daneoleary.com</a>.</p>'
		}
	});

	const result = await sendEmail(platform, { to: params.to, subject, html, text });
	if (result.ok && !result.simulated) {
		return { ...result, message: `Access instructions resent to ${params.to}.` };
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
	const siteUrl = getPublicOrigin(platform);
	const { subject, text, html } = buildClientEmail({
		subject: `Your Briefly link — ${params.briefTitle}`,
		greetingName: params.contactName,
		intro: `Here is your link back to Briefly for "${params.briefTitle}". To sign in, follow these steps:`,
		steps: [
			...portalSignInSteps(siteUrl),
			'Sign in with your email and the PIN we shared with you earlier. (Be sure to select how long you\'d like to remain logged in.)',
			'Open your brief and continue your answers.'
		]
	});

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
	const siteUrl = getPublicOrigin(platform);
	const pinNote = firstLoginPinNote();
	const { subject, text, html } = buildClientEmail({
		subject: 'Your new Briefly sign-in PIN',
		greetingName: params.contactName,
		intro:
			'You requested a new sign-in PIN for Briefly. Use the temporary PIN below to get back in. Follow these steps:',
		steps: [
			...portalSignInSteps(siteUrl),
			`Input your email address, ${params.loginEmail}, and temporary PIN ${params.pin}. (Be sure to select how long you'd like to remain logged in.)`,
			"Set your new PIN that you'll use for all future logins."
		],
		afterSteps: {
			text: `${pinNote.text}\n\nIf you did not request this, email Dane at hello@daneoleary.com.`,
			html: `${pinNote.html}<p>If you did not request this, email Dane at <a href="mailto:hello@daneoleary.com">hello@daneoleary.com</a>.</p>`
		}
	});

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
		'Hi Dane,',
		'',
		`${params.clientContact} at ${params.clientCompany} submitted their brief in Briefly.`,
		`Brief: ${params.briefTitle}`,
		'',
		`Review it here: ${params.submissionUrl}`,
		'',
		'— Briefly'
	].join('\n');
	const html = `
		<p>Hi Dane,</p>
		<p><strong>${params.clientContact}</strong> at <strong>${params.clientCompany}</strong> submitted their brief in Briefly.</p>
		<p>Brief: <strong>${params.briefTitle}</strong></p>
		<p><a href="${params.submissionUrl}">Open submission in Briefly</a></p>
		<p>— Briefly</p>
	`;

	return sendEmail(platform, { to: params.to, subject, html, text });
}
