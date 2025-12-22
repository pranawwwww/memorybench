/**
 * Letta Provider
 * Implements the TemplateType interface for Letta memory system
 */

import type { PreparedData, TemplateType } from '../../types/provider';
import { ingestContent } from './src/ingest';
import { searchMessages } from './src/search';

export default {
    name: "Letta",

    addContext: async (data: PreparedData) => {
        await ingestContent(
            data.content,
            undefined,
            {
                metadata: data.metadata,
            }
        );
    },

    searchQuery: async (query: string, containerTag?: string) => {
        const results = await searchMessages(query, undefined, {
            limit: 10,
        });

        return results.map((result) => ({
            id: result.id,
            context: result.content,
            score: result.score || 0,
        }));
    },

    prepareProvider: async (containerTag: string) => {
        // For Letta, we use a single agent for all benchmark runs
        // The agent ID should be set via LETTA_AGENT_ID environment variable
        console.log(`Using Letta agent for container: ${containerTag}`);
    },
} satisfies TemplateType;
