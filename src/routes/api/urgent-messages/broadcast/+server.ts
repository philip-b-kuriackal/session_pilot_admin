import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const { organization_id, location_id, sender_id, message_text } = await request.json();

        if (!organization_id || !location_id || !sender_id || !message_text) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch all users at this location except the sender
        const { data: users, error: userError } = await locals.supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', organization_id)
            .eq('location_id', location_id)
            .neq('id', sender_id);

        if (userError) throw userError;

        if (users && users.length > 0) {
            const urgentInserts = users.map((u: any) => ({
                organization_id,
                location_id,
                sender_id,
                recipient_id: u.id,
                message_text,
                is_read: false
            }));

            const { error: insertError } = await locals.supabase
                .from('urgent_messages')
                .insert(urgentInserts);

            if (insertError) throw insertError;
        }

        return json({ success: true, broadcasted: users?.length || 0 });
    } catch (err: any) {
        console.error('Urgent broadcast error:', err);
        return json({ error: err.message }, { status: 500 });
    }
};
