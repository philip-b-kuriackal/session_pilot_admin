import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

// Browser-side Supabase client. Server code should use `locals.supabase`
// (created per-request in hooks.server.ts with cookie-based auth).
export const supabase =
	env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY
		? createBrowserClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY)
		: null;
