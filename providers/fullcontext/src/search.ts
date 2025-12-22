/**
 * Search module for FullContext
 * Returns ALL stored content (no retrieval, full context baseline)
 */

import { getAllDocuments } from './store';

export interface SearchOptions {
    limit?: number;
    containerTag?: string;
}

export interface SearchResult {
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, any>;
}

export async function searchDocuments(
    query: string,
    containerTag?: string,
    options?: SearchOptions
): Promise<SearchResult[]> {
    const tag = containerTag || options?.containerTag || 'default';

    // Return ALL documents - no retrieval, no ranking
    // This is the full context baseline
    const results = await getAllDocuments(tag);

    return results;
}
