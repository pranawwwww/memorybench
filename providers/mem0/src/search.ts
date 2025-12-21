/**
 * Search module for Mem0
 * Handles searching memories in Mem0 API
 */

import { config } from './config';

export interface SearchOptions {
    limit?: number;
    userId?: string;
}

export interface SearchResult {
    id: string;
    content: string;
    score?: number;
    metadata?: Record<string, any>;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function searchMemories(
    query: string,
    userId?: string,
    options?: SearchOptions
): Promise<SearchResult[]> {
    const userIdToUse = userId || options?.userId || 'default-user';
    const limit = options?.limit || 10;

    const response = await fetch(`${config.baseUrl}/memories/search/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${config.apiKey}`,
        },
        body: JSON.stringify({
            query: query,
            user_id: userIdToUse,
            limit: limit,
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
        throw new Error(`Failed to search Mem0: ${response.status} ${response.statusText}\n${JSON.stringify(errorDetails, null, 2)}`);
    }

    const data = await response.json();
    const results = data.results || data.memories || [];

    return results.map((result: any) => ({
        id: result.id || result.memory_id || '',
        content: result.memory || result.text || result.content || '',
        score: result.score || result.relevance,
        metadata: result.metadata || {},
        userId: result.user_id,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
    }));
}
