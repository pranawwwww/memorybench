/**
 * Search module for Letta
 * Handles searching messages in Letta agents
 */

import { config } from './config';

export interface SearchOptions {
    limit?: number;
    agentId?: string;
}

export interface SearchResult {
    id: string;
    content: string;
    score?: number;
    metadata?: Record<string, any>;
}

export async function searchMessages(
    query: string,
    agentId?: string,
    options?: SearchOptions
): Promise<SearchResult[]> {
    const agentIdToUse = agentId || options?.agentId || config.agentId;
    const limit = options?.limit || 10;

    if (!agentIdToUse) {
        throw new Error('Agent ID is required. Set LETTA_AGENT_ID environment variable or pass agentId parameter.');
    }

    // Get agent messages
    const response = await fetch(`${config.baseUrl}/v1/agents/${agentIdToUse}/messages?limit=${limit * 3}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
            errorDetails = JSON.parse(errorText);
        } catch {
            errorDetails = errorText;
        }
        throw new Error(`Failed to search Letta: ${response.status} ${response.statusText}\n${JSON.stringify(errorDetails, null, 2)}`);
    }

    const data = await response.json();
    const messages = data.messages || data || [];

    // Simple keyword-based filtering (Letta doesn't have built-in semantic search on messages)
    // In production, you'd want to use a proper search mechanism
    const filtered = Array.isArray(messages) ? messages.filter((msg: any) => {
        const text = msg.text || msg.content || '';
        return text.toLowerCase().includes(query.toLowerCase());
    }).slice(0, limit) : [];

    return filtered.map((msg: any) => ({
        id: msg.id || msg.message_id || '',
        content: msg.text || msg.content || '',
        score: 1.0, // No score available for simple filtering
        metadata: msg.metadata || {},
    }));
}
