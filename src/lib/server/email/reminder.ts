import { env } from '$env/dynamic/private';
import { getPortalUrl } from '$lib/server/config';

type EmailBinding = {
	send: (message: {
		to: string;
		from: { email: string; name?: string };
		subject: string;
		html: string;
		text: string;
	}) => Promise<unknown>;
};

export type ReminderResult = {
	ok: boolean;
	simulated: boolean;
	message: string;
};

function getFromAddress(): string {
	return env.EMAIL_FROM ?? 'briefly@daneoleary.com';
}

async function sendEmail(
	platform: App.Platform | undefined,
	message: { to: string; subject: string; html: string; text: string }
): Promise<ReminderResult> {
	const email = (platform?.env as { EMAIL?: EmailBinding } | undefined)?.EMAIL;

	if (!email) {
		console.log('[briefly email]', message.subject, '→', message.to);
		console.log(message.text);
		return {
			ok: true,
			simulated: true,
			message: 'Email logged locally (configure EMAIL binding for production delivery).'
		};
	}

	try {
		await email.send({
			to: message.to,
			from: { email: getFromAddress(), name: 'Briefly' },
			subject: message.subject,
			html: message.html,
			text: message.text
		});

		return { ok: true, simulated: false, message: 'Email sent.' };
	} catch (error) {
		console.error('[briefly email] send failed', error);
		return { ok: false, simulated: false, message: 'Could not send email.' };
	}
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
	const portalUrl = getPortalUrl();
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
	const portalUrl = getPortalUrl();
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
		'Please save your PIN — you will need it each time you access the questionnaire.',
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
		<p>Please save your PIN — you will need it each time you access the questionnaire.</p>
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
	const portalUrl = getPortalUrl();
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
