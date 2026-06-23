import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serviceClient } from '$lib/server/admin';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders });
};

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email');
	if (!email) {
		return json({ exists: false }, { headers: corsHeaders });
	}

	const svc = serviceClient();
	if (!svc) {
		return json({ exists: false }, { headers: corsHeaders });
	}

	const { data } = await svc
		.from('profiles')
		.select('id')
		.ilike('email', email)
		.limit(1)
		.maybeSingle();

	return json({ exists: !!data }, { headers: corsHeaders });
};
