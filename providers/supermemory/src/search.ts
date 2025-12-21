import { config } from "./config";

export interface SearchOptions {
    containerTag?: string;
    limit?: number;
    threshold?: number;
    includeChunks?: boolean;
}

export interface SearchResult {
    id?: string;
    content: string;
    similarity?: number;
    chunks?: Array<{
        content: string;
        position: number;
        [key: string]: any;
    }>;
    metadata?: Record<string, any>;
}

export async function searchDocuments(
    query: string,
    containerTag?: string,
    options?: SearchOptions
): Promise<SearchResult[]> {
    const requestBody: any = {
        q: query,
        limit: options?.limit || 10,
        threshold: options?.threshold || 0.3,
        include: {
            chunks: options?.includeChunks ?? true,
        },
    };

    if (containerTag) {
        requestBody.containerTag = containerTag;
    }

    const response = await fetch(`${config.baseUrl}/v4/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Search failed: HTTP ${response.status}`);
    }

    const searchResults = await response.json();

    // Transform to standard format
    return (searchResults.results || []).map((result: any) => ({
        id: result.id,
        content: result.memory || '',
        similarity: result.similarity,
        chunks: result.chunks,
        metadata: result.metadata,
    }));
}
