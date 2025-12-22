/**
 * Ingest module for Letta
 * Handles adding messages to Letta agents
 */

import { config } from './config';

export interface IngestOptions {
    agentId?: string;
    metadata?: Record<string, any>;
}

export async function ingestContent(
    content: string,
    agentId?: string,
    options?: IngestOptions
): Promise<void> {
    const agentIdToUse = agentId || options?.agentId || config.agentId;

    if (!agentIdToUse) {
        throw new Error('Agent ID is required. Set LETTA_AGENT_ID environment variable or pass agentId parameter.');
    }

    // Add message to agent
    const response = await fetch(`${config.baseUrl}/v1/agents/${agentIdToUse}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    text: content,
                }
            ],
            metadata: options?.metadata || {},
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
            errorDetails = JSON.parse(errorText);
        } catch {
            errorDetails = errorText;
        }
        throw new Error(`Failed to ingest content to Letta: ${response.status} ${response.statusText}\n${JSON.stringify(errorDetails, null, 2)}`);
    }

    console.log(`Ingested message to Letta agent: ${agentIdToUse}`);
}
