/**
 * Search module for LangChain
 * Handles searching documents in MemoryVectorStore
 */

import { searchDocuments as searchDocs } from './store';

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
    const limit = options?.limit || 10;

    const results = await searchDocs(query, tag, limit);

    return results;
}
