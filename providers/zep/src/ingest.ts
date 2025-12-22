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

    // Zep has a 4096 character limit for messages
    // Split content into chunks if it exceeds this limit
    const MAX_CHUNK_SIZE = 4000; // Leave some buffer
    const chunks: string[] = [];

    if (content.length <= MAX_CHUNK_SIZE) {
        chunks.push(content);
    } else {
        // Split into chunks
        for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
            chunks.push(content.substring(i, i + MAX_CHUNK_SIZE));
        }
    }

    // Ingest each chunk
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkMetadata = {
            ...options?.metadata || {},
            chunk_index: i,
            total_chunks: chunks.length,
        };

        const response = await fetch(`${config.baseUrl}/api/v2/sessions/${sessionIdToUse}/memory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${config.apiKey}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: chunk,
                        metadata: chunkMetadata,
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
    }

    console.log(`Ingested to Zep session: ${sessionIdToUse} (${chunks.length} chunk${chunks.length > 1 ? 's' : ''})`);
}
