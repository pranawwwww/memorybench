/**
 * Ingest module for FullContext
 * Stores all content in memory for full context retrieval
 */

import { addDocument } from './store';

export interface IngestOptions {
    containerTag?: string;
    metadata?: Record<string, any>;
}

export async function ingestContent(
    content: string,
    containerTag?: string,
    options?: IngestOptions
): Promise<void> {
    const tag = containerTag || options?.containerTag || 'default';

    await addDocument(content, tag, options?.metadata);

    console.log(`Ingested to FullContext store: ${tag}`);
}
