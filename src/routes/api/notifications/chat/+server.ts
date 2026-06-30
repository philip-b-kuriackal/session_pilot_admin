import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serviceClient } from '$lib/server/admin';
import { sendPushNotification } from '$lib/server/fcm';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { conversationId, senderId, messageText, senderName } = await request.json();

        if (!conversationId || !senderId || !messageText) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = serviceClient();
        if (!supabase) return json({ error: 'Database uninitialized' }, { status: 500 });

        // Find all members in this conversation, excluding the sender
        const { data: members, error } = await supabase
            .from('conversation_members')
            .select('profile_id')
            .eq('conversation_id', conversationId)
            .neq('profile_id', senderId);

        if (error) throw error;

        if (members && members.length > 0) {
            const pushPromises = members.map(m => 
                sendPushNotification(
                    'user_' + m.profile_id,
                    senderName || 'New Message',
                    messageText,
                    '/chat'
                )
            );
            await Promise.allSettled(pushPromises);
        }

        return json({ success: true, notified: members?.length || 0 });
    } catch (err: any) {
        console.error('Chat notification error:', err);
        return json({ error: err.message }, { status: 500 });
    }
};
