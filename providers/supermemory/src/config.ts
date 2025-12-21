export interface Config {
    apiKey: string;
    baseUrl: string;
}

export const config: Config = {
    apiKey: process.env.SUPERMEMORY_API_KEY || "",
    baseUrl: process.env.SUPERMEMORY_API_URL || "https://api.supermemory.ai",
};

export function validateConfig(required: (keyof Config)[]) {
    const missing = required.filter(key => !config[key]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.map(k => `SUPERMEMORY_${k.toUpperCase()}`).join(', ')}`);
        process.exit(1);
    }
}
