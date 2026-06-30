import { importPKCS8, SignJWT } from 'jose';
import credentials from './firebase-credentials.json';

let cachedToken: string | null = null;
let tokenExpiration = 0;

/**
 * Generates and caches an OAuth2 Access Token for Firebase Cloud Messaging
 * using Cloudflare Edge-compatible standard Web Crypto via the `jose` library.
 */
async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiration) {
        return cachedToken;
    }
    
    const privateKey = await importPKCS8(credentials.private_key, 'RS256');
    const jwt = await new SignJWT({
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
    })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Failed to get FCM token: ' + JSON.stringify(data));
    }
    
    cachedToken = data.access_token;
    // Cache until 1 minute before expiration
    tokenExpiration = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
}

/**
 * Sends a push notification to a specific Firebase Topic via HTTP v1 API.
 */
export async function sendPushNotification(topic: string, title: string, body: string, url: string) {
    try {
        const token = await getAccessToken();
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${credentials.project_id}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    topic: topic,
                    notification: { title, body },
                    data: { url }
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('FCM Send Error:', errorText);
        } else {
            console.log(`Successfully sent FCM topic message to: ${topic}`);
        }
    } catch (e) {
        console.error('Error in sendPushNotification:', e);
    }
}
