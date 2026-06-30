import { importPKCS8, SignJWT } from 'jose';
import { env } from '$env/dynamic/private';

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
    
    const privateKeyStr = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const privateKey = await importPKCS8(privateKeyStr, 'RS256');
    const jwt = await new SignJWT({
        iss: env.FIREBASE_CLIENT_EMAIL,
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
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
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
