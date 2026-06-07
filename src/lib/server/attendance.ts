import { createHmac } from 'node:crypto';

/** Rotating attendance token: a new value every BUCKET_MS, signed per location.
 *  Scanned from the restaurant's QR screen to prove physical presence. */
export const BUCKET_MS = 5000;
// how many past buckets still validate (covers refresh + scan latency / clock skew)
const GRACE_BUCKETS = 3; // ~15s

function sign(secret: string, locationId: string, bucket: number): string {
	return createHmac('sha256', secret)
		.update(`${locationId}:${bucket}`)
		.digest('hex')
		.slice(0, 20);
}

/** `<locationId>.<bucket>.<sig>` — opaque to the client, embedded in the QR URL. */
export function makeToken(locationId: string, secret: string, now = Date.now()): string {
	const bucket = Math.floor(now / BUCKET_MS);
	return `${locationId}.${bucket}.${sign(secret, locationId, bucket)}`;
}

/** Returns the location id the token is valid for, or null. `lookupSecret`
 *  resolves the per-location secret (so this stays usable from any handler). */
export async function verifyToken(
	token: string | null | undefined,
	lookupSecret: (locationId: string) => Promise<string | null>,
	now = Date.now()
): Promise<string | null> {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	const [locationId, bucketStr, sig] = parts;
	const bucket = Number(bucketStr);
	if (!locationId || !Number.isFinite(bucket) || !sig) return null;

	const secret = await lookupSecret(locationId);
	if (!secret) return null;

	const current = Math.floor(now / BUCKET_MS);
	if (bucket > current + 1 || bucket < current - GRACE_BUCKETS) return null; // outside window

	// constant-ish comparison across the accepted bucket range
	for (let b = bucket; b <= current + 1; b++) {
		if (sign(secret, locationId, b) === sig) return locationId;
	}
	return null;
}
