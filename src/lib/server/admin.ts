import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Service-role client — server only. Used for operations that must bypass RLS,
 * e.g. creating auth users from the admin portal. Never expose to the browser.
 */
export function serviceClient(): SupabaseClient | null {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const key = privateEnv.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) return null;
	return createClient(url, key, { auth: { persistSession: false } });
}

/** Write an immutable audit log entry as the acting user. */
export async function audit(
	locals: App.Locals,
	action: string,
	entity_type?: string,
	entity_id?: string,
	details: Record<string, unknown> = {}
) {
	if (!locals.supabase || !locals.user) return;
	await locals.supabase.from('audit_logs').insert({
		organization_id: locals.profile?.organization_id ?? null,
		actor_id: locals.user.id,
		action,
		entity_type: entity_type ?? null,
		entity_id: entity_id ?? null,
		details
	});
}
