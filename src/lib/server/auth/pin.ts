function encodeBase64Url(data: Uint8Array): string {
	return btoa(String.fromCharCode(...data))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function generatePin(): string {
	const pin = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
	return pin.toString().padStart(6, '0');
}

export async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
	const pinSalt = salt ?? encodeBase64Url(crypto.getRandomValues(new Uint8Array(16)));
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(`${pin}:${pinSalt}`),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const derived = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: new TextEncoder().encode('briefly-pin'),
			iterations: 100_000,
			hash: 'SHA-256'
		},
		keyMaterial,
		256
	);
	return { hash: encodeBase64Url(new Uint8Array(derived)), salt: pinSalt };
}

export async function verifyPin(
	pin: string,
	storedHash: string,
	salt: string
): Promise<boolean> {
	const { hash } = await hashPin(pin, salt);
	if (hash.length !== storedHash.length) return false;

	let valid = true;
	for (let i = 0; i < hash.length; i += 1) {
		if (hash.charCodeAt(i) !== storedHash.charCodeAt(i)) valid = false;
	}
	return valid;
}
