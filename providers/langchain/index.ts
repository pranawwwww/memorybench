/**
 * LangChain Provider
 * Implements the TemplateType interface for LangChain MemoryVectorStore
 */

import type { PreparedData, TemplateType } from '../../types/provider';
import { ingestContent } from './src/ingest';
import { searchDocuments } from './src/search';

export default {
    name: "LangChain",

    addContext: async (data: PreparedData) => {
        await ingestContent(
            data.content,
            data.containerTag,
            {
                metadata: data.metadata,
            }
        );
    },

    searchQuery: async (query: string, containerTag?: string) => {
        const results = await searchDocuments(query, containerTag, {
            limit: 10,
        });

        return results.map((result) => ({
            id: result.id,
            context: result.content,
            score: result.score,
        }));
    },

    prepareProvider: async (containerTag: string) => {
        // LangChain uses in-memory vector store per container tag
        console.log(`Using LangChain MemoryVectorStore for container: ${containerTag}`);
    },
} satisfies TemplateType;
