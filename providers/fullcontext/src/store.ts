/**
 * Full context store for baseline comparison
 * Stores all content without any retrieval/ranking - returns full context
 */

interface StoredDocument {
    content: string;
    metadata: Record<string, any>;
    timestamp: string;
}

// Global store instances keyed by container tag
const stores = new Map<string, StoredDocument[]>();

export async function addDocument(
    content: string,
    containerTag: string,
    metadata?: Record<string, any>
): Promise<void> {
    if (!stores.has(containerTag)) {
        stores.set(containerTag, []);
    }

    stores.get(containerTag)!.push({
        content,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
    });
}

export async function getAllDocuments(
    containerTag: string
): Promise<Array<{ id: string; content: string; score: number; metadata: Record<string, any> }>> {
    const store = stores.get(containerTag) || [];

    // Return all documents with score 1.0 (perfect match since we're using full context)
    const results = store.map((doc, index) => ({
        id: `${containerTag}-${index}`,
        content: doc.content,
        score: 1.0,
        metadata: doc.metadata,
    }));

    return results;
}

export function clearStore(containerTag: string): void {
    stores.delete(containerTag);
}

export function getAllStores(): Map<string, StoredDocument[]> {
    return stores;
}
