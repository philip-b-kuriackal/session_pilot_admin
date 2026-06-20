import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serviceClient } from '$lib/server/admin';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders });
};

export const POST: RequestHandler = async ({ request }) => {
	const svc = serviceClient();
	if (!svc) {
		return json({ error: 'Service role key missing on backend' }, { status: 500, headers: corsHeaders });
	}

	let body;
	try {
		body = await request.json();
	} catch (e) {
		return json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
	}

	const { action, userId, userName, timeEntryId, breakId, qrToken } = body;

	if (!userId) {
		return json({ error: 'Missing userId' }, { status: 400, headers: corsHeaders });
	}

	let realUserId = userId;
	// Check if the user profile actually exists in the database
	const { data: existingProfile } = await svc.from('profiles').select('id').eq('id', realUserId).single();

	if (!existingProfile) {
		return json({ error: 'User profile not found in database' }, { status: 404, headers: corsHeaders });
	}

	const now = new Date().toISOString();

	// 2. Handle Actions
	if (action === 'clock_in') {
		if (!qrToken) {
			return json({ error: 'Invalid or expired QR code' }, { status: 400, headers: corsHeaders });
		}

		const { verifyToken } = await import('$lib/server/attendance');
		const qrLocId = await verifyToken(qrToken, async (id) => {
			const { data } = await svc.from('locations').select('attendance_secret').eq('id', id).single();
			return data?.attendance_secret || null;
		});
		
		if (!qrLocId) return json({ error: 'Invalid or expired QR code' }, { status: 400, headers: corsHeaders });
		
		const { data: userProfile } = await svc.from('profiles').select('location_id').eq('id', realUserId).single();
		
		if (!userProfile?.location_id || userProfile.location_id !== qrLocId) {
			return json({ error: 'Wrong organization' }, { status: 400, headers: corsHeaders });
		}
		
		const checkInLocId = qrLocId;

		const { data, error } = await svc
			.from('time_entries')
			.insert({
				user_id: realUserId,
				location_id: checkInLocId,
				clock_in: now
			})
			.select()
			.single();

		if (error) return json({ error: error.message }, { status: 500, headers: corsHeaders });
		return json({ success: true, timeEntryId: data.id }, { headers: corsHeaders });
	} 
	
	else if (action === 'pause') {
		if (!timeEntryId) return json({ error: 'Missing timeEntryId' }, { status: 400, headers: corsHeaders });
		
		const { data, error } = await svc
			.from('time_entry_breaks')
			.insert({
				time_entry_id: timeEntryId,
				break_start: now
			})
			.select()
			.single();

		if (error) return json({ error: error.message }, { status: 500, headers: corsHeaders });
		return json({ success: true, breakId: data.id }, { headers: corsHeaders });
	}
	
	else if (action === 'resume') {
		if (!breakId) return json({ error: 'Missing breakId' }, { status: 400, headers: corsHeaders });

		const { error } = await svc
			.from('time_entry_breaks')
			.update({ break_end: now })
			.eq('id', breakId);

		if (error) return json({ error: error.message }, { status: 500, headers: corsHeaders });
		return json({ success: true }, { headers: corsHeaders });
	}
	
	else if (action === 'clock_out') {
		if (!timeEntryId) return json({ error: 'Missing timeEntryId' }, { status: 400, headers: corsHeaders });

		// Optional: close break if any
		if (breakId) {
			await svc.from('time_entry_breaks').update({ break_end: now }).eq('id', breakId);
		}

		const { error } = await svc
			.from('time_entries')
			.update({ clock_out: now })
			.eq('id', timeEntryId);

		if (error) return json({ error: error.message }, { status: 500, headers: corsHeaders });
		return json({ success: true }, { headers: corsHeaders });
	}

	return json({ error: 'Invalid action' }, { status: 400 });
};
