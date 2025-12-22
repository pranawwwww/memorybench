/**
 * FullContext Provider
 * Baseline implementation that provides full context without any retrieval
 * This serves as an upper-bound baseline for benchmark comparison
 */

import type { PreparedData, TemplateType } from '../../types/provider';
import { ingestContent } from './src/ingest';
import { searchDocuments } from './src/search';

export default {
    name: "FullContext",

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
            limit: 999999, // No limit - return everything
        });

        return results.map((result) => ({
            id: result.id,
            context: result.content,
            score: result.score,
        }));
    },

    prepareProvider: async (containerTag: string) => {
        console.log(`Using FullContext (no retrieval) for container: ${containerTag}`);
    },
} satisfies TemplateType;
