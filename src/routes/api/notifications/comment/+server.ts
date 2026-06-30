import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushNotification } from '$lib/server/fcm';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { postAuthorId, commenterName, commentText } = await request.json();

        if (!postAuthorId || !commentText) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        await sendPushNotification(
            'user_' + postAuthorId,
            'New Comment on your Post',
            `${commenterName || 'Someone'} commented: "${commentText}"`,
            '/feed'
        );

        return json({ success: true });
    } catch (err: any) {
        console.error('Comment notification error:', err);
        return json({ error: err.message }, { status: 500 });
    }
};
