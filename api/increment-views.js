import { kv } from '@vercel/kv';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed.' });
    }

    try {
        const { collectionId } = request.body;

        if (!collectionId) {
            return response.status(400).json({ error: 'collectionId is required.' });
        }

        // --- IP-based rate limiting ---
        const forwarded = request.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : request.socket.remoteAddress;
        const key = `view:${collectionId}:${ip}`;
        console.log(`DEBUG: IP extracted: ${ip}`);
        console.log(`DEBUG: KV key: ${key}`);
        const lastViewTimestamp = await kv.get(key);
        console.log(`DEBUG: lastViewTimestamp from KV:`, lastViewTimestamp);

        const now = Date.now();
        if (lastViewTimestamp && (now - lastViewTimestamp < COOLDOWN_PERIOD)) {
            console.log(`DEBUG: View blocked by cooldown. Last view was at: ${new Date(lastViewTimestamp).toISOString()}`);
            return response.status(200).json({ message: 'View already recorded recently.' });
        }
        // --- End of IP-based rate limiting ---

        // Increment view count in KV
        const viewCountKey = `views:${collectionId}`;
        const currentViews = await kv.get(viewCountKey) || 0;
        const newViews = currentViews + 1;
        await kv.set(viewCountKey, newViews);

        // Update the timestamp in KV store for rate limiting
        console.log(`DEBUG: About to set new timestamp in KV: ${now}`);
        await kv.set(key, now, { ex: COOLDOWN_PERIOD / 1000 }); // Set with expiration
        console.log(`DEBUG: KV timestamp set successfully.`);

        return response.status(200).json({ message: 'View count incremented.', views: newViews });

    } catch (error) {
        console.error('Error incrementing view count:', error);
        return response.status(500).json({ error: 'Failed to increment view count.' });
    }
}