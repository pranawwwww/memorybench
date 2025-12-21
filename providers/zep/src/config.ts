/**
 * Configuration for Zep API
 * Docs: https://docs.getzep.com/
 */

export interface Config {
    apiKey: string;
    baseUrl: string;
}

export const config: Config = {
    apiKey: process.env.ZEP_API_KEY || "",
    baseUrl: process.env.ZEP_API_URL || "https://api.getzep.com",
};

if (!config.apiKey) {
    console.warn('Warning: ZEP_API_KEY is not set in environment variables');
}
