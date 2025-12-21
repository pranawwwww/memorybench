import type { BenchmarkRegistry, BenchmarkType } from "../../benchmarks";
import type { PreparedData, TemplateType } from "../_template";
import { config, validateConfig } from "./src/config";
import { ingestDocument } from "./src/ingest";
import { searchDocuments } from "./src/search";

// Validate required config on load
validateConfig(['apiKey', 'baseUrl']);

export default {
	name: "Supermemory",
	addContext: async (data: PreparedData) => {
		console.log(`Ingesting into Supermemory...`);
		await ingestDocument(data);
	},

	searchQuery: async (query: string, containerTag?: string) => {
		console.log(`Searching Supermemory: ${query}`);
		const results = await searchDocuments(query, containerTag);

		return results.map((result) => ({
			id: result.id || '',
			context: result.content,
			score: result.similarity || 0,
		}));
	},

	prepareProvider: <T extends BenchmarkType>(
		benchmarkType: T,
		data: BenchmarkRegistry[T][],
	): PreparedData[] => {
		// For now, we'll handle LongMemEval-specific preparation elsewhere
		// This is for template benchmark compatibility
		throw new Error(
			`Supermemory provider does not use prepareProvider for ${benchmarkType}. Use LongMemEval runner directly.`,
		);
	},
} satisfies TemplateType;
