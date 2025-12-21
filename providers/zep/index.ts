/**
 * Zep Provider
 * Implements the provider interface for Zep long-term memory store
 */

import type { TemplateType, BenchmarkType, PreparedData } from '../_template';
import { ingestContent } from './src/ingest';
import { searchMemories } from './src/search';

export default {
    name: "Zep",

    addContext: async (data: PreparedData) => {
        console.log(`Ingesting into Zep...`);

        // For LongMemEval, we use containerTag as the sessionId to isolate different runs
        const sessionId = data.containerTag || 'default-session';

        await ingestContent(data.content, sessionId, {
            metadata: data.metadata || {},
        });
    },

    searchQuery: async (query: string, containerTag?: string) => {
        console.log(`Searching Zep: ${query}`);

        // Use containerTag as sessionId for isolation
        const sessionId = containerTag || 'default-session';

        const results = await searchMemories(query, sessionId, {
            limit: 10,
            searchScope: 'messages',
        });

        return results.map((result) => ({
            id: result.id || '',
            context: result.content,
            score: result.score || 0,
        }));
    },

    prepareProvider: <T extends BenchmarkType>(benchmarkType: T, data: any) => {
        throw new Error(`Zep provider does not use prepareProvider for ${benchmarkType}. Use LongMemEval runner directly.`);
    },
} satisfies TemplateType;
