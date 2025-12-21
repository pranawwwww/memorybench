/**
 * Configuration for Mem0 API
 * Docs: https://docs.mem0.ai/
 */

export interface Config {
    apiKey: string;
    baseUrl: string;
}

export const config: Config = {
    apiKey: process.env.MEM0_API_KEY || "",
    baseUrl: process.env.MEM0_API_URL || "https://api.mem0.ai/v1",
};

if (!config.apiKey) {
    console.warn('Warning: MEM0_API_KEY is not set in environment variables');
}
