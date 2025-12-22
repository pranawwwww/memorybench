/**
 * Configuration for Letta API
 * Docs: https://docs.letta.com/
 */

export interface Config {
    apiKey: string;
    baseUrl: string;
    agentId?: string;
    archiveId?: string;
}

export const config: Config = {
    apiKey: process.env.LETTA_API_KEY || "",
    baseUrl: process.env.LETTA_API_URL || "https://api.letta.com",
    agentId: process.env.LETTA_AGENT_ID,
    archiveId: process.env.LETTA_ARCHIVE_ID,
};

if (!config.apiKey) {
    console.warn('Warning: LETTA_API_KEY is not set in environment variables');
}

if (!config.agentId) {
    console.warn('Warning: LETTA_AGENT_ID is not set in environment variables. Please set it to a valid agent ID (e.g., agent-123e4567-e89b-42d3-8456-426614174000)');
}
