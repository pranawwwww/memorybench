/**
 * Batch ingestion for Supermemory
 * Reduces API calls by sending multiple documents at once
 */

import { config } from "./config";

export interface BatchIngestItem {
    content: string;
    containerTag?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Ingest multiple documents in a single API call
 * This significantly reduces the number of API requests
 */
export async function batchIngestContent(
    items: BatchIngestItem[]
): Promise<void> {
    if (items.length === 0) return;

    // Supermemory API doesn't have a native batch endpoint,
    // so we'll use Promise.all for concurrent requests with rate limiting
    const CONCURRENT_LIMIT = 5; // Adjust based on API rate limits

    for (let i = 0; i < items.length; i += CONCURRENT_LIMIT) {
        const batch = items.slice(i, i + CONCURRENT_LIMIT);

        await Promise.all(
            batch.map(async (item) => {
                const response = await fetch(`${config.baseUrl}/v3/documents`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        content: item.content,
                        containerTags: item.containerTag ? [item.containerTag] : [],
                        metadata: item.metadata || {},
                    }),
                });

                if (!response.ok) {
                    let errorDetails = `status: ${response.status}`;
                    try {
                        const errorBody = await response.text();
                        if (errorBody) {
                            errorDetails += ` - ${errorBody.substring(0, 200)}`;
                        }
                    } catch (e) {
                        // Ignore if we can't read the error body
                    }
                    throw new Error(`Failed to batch ingest content: ${errorDetails}`);
                }
            })
        );

        // Small delay between batches to avoid rate limiting
        if (i + CONCURRENT_LIMIT < items.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
