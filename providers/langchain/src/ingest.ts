/**
 * Ingest module for LangChain
 * Handles adding documents to MemoryVectorStore
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

    console.log(`Ingested to LangChain vector store: ${tag}`);
}
