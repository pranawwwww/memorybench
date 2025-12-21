/**
 * Ingest module for Zep
 * Handles adding memories to Zep
 */

import { config } from './config';

export interface IngestOptions {
    sessionId?: string;
    metadata?: Record<string, any>;
}

export async function ingestContent(
    content: string,
    sessionId?: string,
    options?: IngestOptions
): Promise<void> {
    const sessionIdToUse = sessionId || options?.sessionId || 'default-session';

    // Add message to session memory
    const response = await fetch(`${config.baseUrl}/api/v2/sessions/${sessionIdToUse}/memory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: content,
                    metadata: options?.metadata || {},
                }
            ],
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
        throw new Error(`Failed to ingest content to Zep: ${response.status} ${response.statusText}\n${JSON.stringify(errorDetails, null, 2)}`);
    }

    console.log(`Ingested to Zep session: ${sessionIdToUse}`);
}
