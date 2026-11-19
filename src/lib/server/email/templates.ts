import type { EmailOwner } from '$lib/server/admin-profile';

export type { EmailOwner };

export function contactFirstName(contactName: string): string {
	const trimmed = contactName.trim();
	if (!trimmed) return 'there';
	return trimmed.split(/\s+/)[0] ?? 'there';
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

export function firstLoginPinNote(): { text: string; html: string } {
	const text =
		"On your first login, you'll be required to set up your own digital PIN so you can access your brief again anytime.";
	return {
		text,
		html: `<p>${text}</p>`
	};
}

export function clientEmailSignOff(owner: EmailOwner): { text: string; html: string } {
	const name = escapeHtml(owner.firstName);
	const email = escapeHtml(owner.supportEmail);
	const text = [
		'',
		`If you have trouble or questions at any point, send an email to ${owner.firstName} at ${owner.supportEmail}.`,
		'',
		'Looking forward to working with you!',
		'',
		owner.displayName,
		owner.business && owner.business !== owner.displayName ? owner.business : ''
	]
		.join('\n')
		.trimEnd();
	const business =
		owner.business && owner.business !== owner.displayName ? `<br>${escapeHtml(owner.business)}` : '';
	const html = `
		<p>If you have trouble or questions at any point, send an email to ${name} at <a href="mailto:${email}">${email}</a>.</p>
		<p>Looking forward to working with you!</p>
		<p>${escapeHtml(owner.displayName)}${business}</p>
	`;
	return { text, html };
}

type ClientEmailOptions = {
	owner: EmailOwner;
	subject: string;
	greetingName: string;
	intro: string;
	steps: string[];
	afterSteps?: { text: string; html: string };
	includeSignOff?: boolean;
};

export function buildClientEmail(options: ClientEmailOptions): {
	subject: string;
	text: string;
	html: string;
} {
	const firstName = escapeHtml(contactFirstName(options.greetingName));
	const intro = options.intro;
	const steps = options.steps;
	const pinNote = options.afterSteps;
	const signOff = options.includeSignOff !== false ? clientEmailSignOff(options.owner) : { text: '', html: '' };

	const textSteps = steps.map((step, index) => `${index + 1}. ${step}`).join('\n');

	const textParts = [
		`Hi ${contactFirstName(options.greetingName)},`,
		'',
		intro,
		'',
		textSteps
	];
	if (pinNote?.text) textParts.push('', pinNote.text);
	if (signOff.text) textParts.push(signOff.text);
	const text = textParts.join('\n');

	const htmlSteps = steps
		.map((step) => `<li>${escapeHtml(step)}</li>`)
		.join('\n');

	const html = `
		<p>Hi ${firstName},</p>
		<p>${escapeHtml(intro)}</p>
		<ol>
			${htmlSteps}
		</ol>
		${pinNote?.html ?? ''}
		${signOff.html}
	`.trim();

	return { subject: options.subject, text, html };
}

export function portalSignInSteps(siteUrl: string): string[] {
	return [
		`Navigate to ${siteUrl}.`,
		'Click the Client portal "Sign in" button.'
	];
}
