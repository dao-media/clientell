import { env } from '$env/dynamic/private';

type OutboundEmail = {
	to: string;
	subject: string;
	html: string;
	text: string;
	fromName?: string;
};

export type SendResult = {
	ok: boolean;
	simulated: boolean;
	message: string;
};

type EmailBinding = {
	send: (message: {
		to: string;
		from: { email: string; name?: string };
		subject: string;
		html: string;
		text: string;
	}) => Promise<unknown>;
};

export function getFromAddress(): string {
	return env.EMAIL_FROM ?? 'briefly@daneoleary.com';
}

function getApiCredentials(): { accountId: string; token: string } | null {
	const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
	const token = (env.EMAIL_API_TOKEN ?? env.CLOUDFLARE_API_TOKEN)?.trim();
	if (!accountId || !token) return null;
	return { accountId, token };
}

async function sendViaBinding(
	platform: App.Platform | undefined,
	message: OutboundEmail
): Promise<SendResult | null> {
	const email = (platform?.env as { EMAIL?: EmailBinding } | undefined)?.EMAIL;
	if (!email) return null;

	try {
		await email.send({
			to: message.to,
			from: { email: getFromAddress(), name: message.fromName ?? 'Briefly' },
			subject: message.subject,
			html: message.html,
			text: message.text
		});
		return { ok: true, simulated: false, message: 'Email sent.' };
	} catch (error) {
		console.error('[briefly email] binding send failed', error);
		return { ok: false, simulated: false, message: 'Could not send email.' };
	}
}

async function sendViaRestApi(message: OutboundEmail): Promise<SendResult | null> {
	const credentials = getApiCredentials();
	if (!credentials) return null;

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/email/sending/send`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${credentials.token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				to: message.to,
				from: { address: getFromAddress(), name: message.fromName ?? 'Briefly' },
				subject: message.subject,
				html: message.html,
				text: message.text
			})
		}
	);

	const payload = (await response.json()) as {
		success?: boolean;
		errors?: Array<{ message?: string }>;
		result?: { delivered?: string[]; permanent_bounces?: string[] };
	};

	if (!response.ok || !payload.success) {
		const detail = payload.errors?.[0]?.message ?? `HTTP ${response.status}`;
		console.error('[briefly email] REST send failed', detail, payload);
		return { ok: false, simulated: false, message: detail };
	}

	const delivered = payload.result?.delivered?.length ?? 0;
	const bounced = payload.result?.permanent_bounces?.length ?? 0;
	if (bounced > 0 && delivered === 0) {
		return { ok: false, simulated: false, message: 'Email bounced.' };
	}

	return { ok: true, simulated: false, message: 'Email sent.' };
}

export async function sendOutboundEmail(
	platform: App.Platform | undefined,
	message: OutboundEmail
): Promise<SendResult> {
	const viaBinding = await sendViaBinding(platform, message);
	if (viaBinding) return viaBinding;

	const viaApi = await sendViaRestApi(message);
	if (viaApi) return viaApi;

	console.log('[briefly email]', message.subject, '→', message.to);
	console.log(message.text);
	return {
		ok: true,
		simulated: true,
		message:
			'Email logged locally (enable Email Sending on daneoleary.com and set CLOUDFLARE_ACCOUNT_ID + EMAIL_API_TOKEN).'
	};
}
