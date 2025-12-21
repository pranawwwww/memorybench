import { config } from "./config";
import type { PreparedData } from "../../_template";

export interface IngestOptions {
    containerTag?: string;
    metadata?: Record<string, unknown>;
}

export async function ingestDocument(
    data: PreparedData,
    options?: IngestOptions
): Promise<void> {
    const containerTags = options?.containerTag ? [options.containerTag] : [];

    const response = await fetch(`${config.baseUrl}/v3/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            content: data.context,
            containerTags,
            metadata: options?.metadata || data.metadata,
        }),
    });

    if (!response.ok) {
        let errorDetails = `status: ${response.status}`;
        try {
            const errorBody = await response.text();
            if (errorBody) {
                errorDetails += ` - ${errorBody.substring(0, 200)}`;
            }
        } catch (e) {
            // Ignore if we can't read the error body
        }
        throw new Error(`Failed to ingest document: ${errorDetails}`);
    }
}

export async function ingestContent(
    content: string,
    containerTag?: string
): Promise<void> {
    const response = await fetch(`${config.baseUrl}/v3/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            content,
            containerTags: containerTag ? [containerTag] : [],
        }),
    });

    if (!response.ok) {
        let errorDetails = `status: ${response.status}`;
        try {
            const errorBody = await response.text();
            if (errorBody) {
                errorDetails += ` - ${errorBody.substring(0, 200)}`;
            }
        } catch (e) {
            // Ignore if we can't read the error body
        }
        throw new Error(`Failed to ingest content: ${errorDetails}`);
    }
}
