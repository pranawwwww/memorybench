/**
 * Vector store management for LangChain
 * Uses simple in-memory storage with manual embeddings
 */

import { OpenAIEmbeddings } from "@langchain/openai";

interface StoredDocument {
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
}

// Global store instances keyed by container tag
const stores = new Map<string, StoredDocument[]>();

// Embeddings instance
let embeddings: OpenAIEmbeddings | null = null;

function getEmbeddings(): OpenAIEmbeddings {
    if (!embeddings) {
        embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
    }
    return embeddings;
}

function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

export async function addDocument(
    content: string,
    containerTag: string,
    metadata?: Record<string, any>
): Promise<void> {
    if (!stores.has(containerTag)) {
        stores.set(containerTag, []);
    }

    const embeddingsClient = getEmbeddings();
    const embedding = await embeddingsClient.embedQuery(content);

    stores.get(containerTag)!.push({
        content,
        metadata: metadata || {},
        embedding,
    });
}

export async function searchDocuments(
    query: string,
    containerTag: string,
    limit: number = 10
): Promise<Array<{ id: string; content: string; score: number; metadata: Record<string, any> }>> {
    const store = stores.get(containerTag) || [];

    if (store.length === 0) {
        return [];
    }

    const embeddingsClient = getEmbeddings();
    const queryEmbedding = await embeddingsClient.embedQuery(query);

    // Calculate similarity scores
    const results = store.map((doc, index) => ({
        id: `${containerTag}-${index}`,
        content: doc.content,
        score: cosineSimilarity(queryEmbedding, doc.embedding),
        metadata: doc.metadata,
    }));

    // Sort by score descending and take top k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
}
