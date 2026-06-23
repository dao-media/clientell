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

export function getFromAddress(platform?: App.Platform): string {
	const platformEnv = platform?.env as { EMAIL_FROM?: string } | undefined;
	return platformEnv?.EMAIL_FROM ?? env.EMAIL_FROM ?? 'briefly@daneoleary.com';
}

function readEnvString(platform: App.Platform | undefined, key: string): string | undefined {
	const platformEnv = platform?.env as Record<string, string | undefined> | undefined;
	return platformEnv?.[key] ?? (env as Record<string, string | undefined>)[key];
}

function getApiCredentials(
	platform?: App.Platform
): { accountId: string; token: string; fallbackToken?: string } | null {
	const accountId = readEnvString(platform, 'CLOUDFLARE_ACCOUNT_ID')?.trim();
	const emailToken = readEnvString(platform, 'EMAIL_API_TOKEN')?.trim();
	const cloudflareToken = readEnvString(platform, 'CLOUDFLARE_API_TOKEN')?.trim();
	const token = emailToken || cloudflareToken;
	if (!accountId || !token) return null;

	const fallbackToken =
		emailToken && cloudflareToken && emailToken !== cloudflareToken ? cloudflareToken : undefined;

	return { accountId, token, fallbackToken };
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
			from: { email: getFromAddress(platform), name: message.fromName ?? 'Briefly' },
			subject: message.subject,
			html: message.html,
			text: message.text
		});
		return { ok: true, simulated: false, message: 'Email sent.' };
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'Could not send email.';
		console.error('[briefly email] binding send failed', error);
		return { ok: false, simulated: false, message: detail };
	}
}

async function sendViaRestApi(
	platform: App.Platform | undefined,
	message: OutboundEmail
): Promise<SendResult | null> {
	const credentials = getApiCredentials(platform);
	if (!credentials) return null;

	const attempt = async (token: string): Promise<SendResult> => {
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/email/sending/send`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					to: message.to,
					from: { address: getFromAddress(platform), name: message.fromName ?? 'Briefly' },
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
			const authFailed = detail === 'Authentication error.' || detail === 'Authentication error';
			const userMessage = authFailed
				? 'Email API token is invalid or missing Email Sending permission. Update EMAIL_API_TOKEN in Pages secrets (Account → Email Sending → Edit).'
				: detail;
			return { ok: false, simulated: false, message: userMessage, authFailed };
		}

		const delivered = payload.result?.delivered?.length ?? 0;
		const bounced = payload.result?.permanent_bounces?.length ?? 0;
		if (bounced > 0 && delivered === 0) {
			return { ok: false, simulated: false, message: 'Email bounced.', authFailed: false };
		}

		return { ok: true, simulated: false, message: 'Email sent.', authFailed: false };
	};

	let result = await attempt(credentials.token);
	if (!result.ok && result.authFailed && credentials.fallbackToken) {
		console.warn('[briefly email] primary token rejected; retrying with fallback token');
		result = await attempt(credentials.fallbackToken);
	}

	const { authFailed: _authFailed, ...sendResult } = result;
	return sendResult;
}

export async function sendOutboundEmail(
	platform: App.Platform | undefined,
	message: OutboundEmail
): Promise<SendResult> {
	const viaBinding = await sendViaBinding(platform, message);
	if (viaBinding) return viaBinding;

	const viaApi = await sendViaRestApi(platform, message);
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
