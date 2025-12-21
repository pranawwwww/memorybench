/**
 * Ingest module for Mem0
 * Handles adding memories to Mem0 API
 */

import { config } from './config';

export interface IngestOptions {
    userId?: string;
    metadata?: Record<string, any>;
}

export async function ingestContent(
    content: string,
    userId?: string,
    options?: IngestOptions
): Promise<void> {
    const userIdToUse = userId || options?.userId || 'default-user';

    const response = await fetch(`${config.baseUrl}/memories/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${config.apiKey}`,
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            user_id: userIdToUse,
            metadata: options?.metadata || {},
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
            errorDetails = JSON.parse(errorText);
        } catch {
            errorDetails = errorText;
        }
        throw new Error(`Failed to ingest content to Mem0: ${response.status} ${response.statusText}\n${JSON.stringify(errorDetails, null, 2)}`);
    }

    const result = await response.json();
    console.log(`Ingested to Mem0 for user ${userIdToUse}`);
}
