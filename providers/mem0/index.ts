/**
 * Mem0 Provider
 * Implements the provider interface for Mem0 memory system
 */

import type { TemplateType, BenchmarkType, PreparedData } from '../_template';
import { ingestContent } from './src/ingest';
import { searchMemories } from './src/search';

export default {
    name: "Mem0",

    addContext: async (data: PreparedData) => {
        console.log(`Ingesting into Mem0...`);

        // For LongMemEval, we use containerTag as the userId to isolate different runs
        const userId = data.containerTag || 'default-user';

        await ingestContent(data.content, userId, {
            metadata: data.metadata || {},
        });
    },

    searchQuery: async (query: string, containerTag?: string) => {
        console.log(`Searching Mem0: ${query}`);

        // Use containerTag as userId for isolation
        const userId = containerTag || 'default-user';

        const results = await searchMemories(query, userId, {
            limit: 10,
        });

        return results.map((result) => ({
            id: result.id || '',
            context: result.content,
            score: result.score || 0,
        }));
    },

    prepareProvider: <T extends BenchmarkType>(benchmarkType: T, data: any) => {
        throw new Error(`Mem0 provider does not use prepareProvider for ${benchmarkType}. Use LongMemEval runner directly.`);
    },
} satisfies TemplateType;
