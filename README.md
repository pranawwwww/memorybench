# MemoryBench

A unified benchmarking platform for evaluating AI memory providers. Compare different memory systems (SuperMemory, Mem0, Zep, LangChain, etc.) against standardized benchmarks with interactive visualization.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Running Benchmarks](#running-benchmarks)
- [Visualization Dashboard](#visualization-dashboard)
- [Adding New Providers](#adding-new-providers)
- [Adding New Benchmarks](#adding-new-benchmarks)
- [Project Architecture](#project-architecture)
- [Troubleshooting](#troubleshooting)

## Features

- **Multiple Benchmarks**: NoLiMa (needle-in-haystack), LongMemEval (long-term memory), LoCoMo (conversational memory)
- **Extensible Providers**: Auto-discovery of new providers - just add a folder
- **Unified CLI**: Single interface for all benchmarks and providers
- **Checkpointing**: Resume interrupted runs automatically
- **Performance Metrics**: Track API response times and throughput
- **Visualization Dashboard**: Interactive web UI for comparing results

## Quick Start

### 1. Install Bun

MemoryBench uses [Bun](https://bun.sh/) as its runtime:

```bash
# macOS / Linux / WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

### 2. Install Dependencies

```bash
cd memorybench
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Provider API Keys (add the ones you need)
SUPERMEMORY_API_KEY=your_supermemory_key
SUPERMEMORY_API_URL=https://api.supermemory.ai

MEM0_API_KEY=your_mem0_key
MEM0_API_URL=https://api.mem0.ai/v1

ZEP_API_KEY=your_zep_key
ZEP_API_URL=https://api.getzep.com

# Evaluation Model API Keys (at least one required)
OPENAI_API_KEY=your_openai_key           # For GPT models
ANTHROPIC_API_KEY=your_anthropic_key     # For Claude models

# Optional: For Gemini models
GOOGLE_VERTEX_PROJECT_ID=your_project_id
GOOGLE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Prepare Datasets

**LongMemEval:**
```bash
# Download from HuggingFace: https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned
mkdir -p benchmarks/LongMemEval/datasets
mv ~/Downloads/longmemeval_s_cleaned.json benchmarks/LongMemEval/datasets/

# Split into individual questions
cd benchmarks/LongMemEval && bun run scripts/setup/split_questions.ts && cd ../..
```

**NoLiMa:** Datasets should be in `benchmarks/NoLiMa/datasets/`

**LoCoMo:** Dataset is included at `benchmarks/LoCoMo/locomo10.json`

---

## Running Benchmarks

### Basic Usage

```bash
bun run benchmark <benchmark-name> <provider-name> [options]
```

### Available Benchmarks

| Benchmark | Description | Test Cases |
|-----------|-------------|------------|
| `NoLiMa` | Needle-in-a-haystack across context lengths (1K-32K) | ~100+ tests |
| `LongMemEval` | Long-term memory with 6 question types | 500 questions |
| `LoCoMo` | Conversational memory with multi-hop reasoning | ~2000 questions |

### Available Providers

| Provider | Description | Requires API Key |
|----------|-------------|------------------|
| `supermemory` | SuperMemory API | `SUPERMEMORY_API_KEY` |
| `mem0` | Mem0 memory system | `MEM0_API_KEY` |
| `zep` | Zep long-term memory | `ZEP_API_KEY` |
| `langchain` | In-memory vector store | `OPENAI_API_KEY` |
| `fullcontext` | Baseline (returns all context) | None |

### Examples

```bash
# Quick test with 5 samples
bun run benchmark NoLiMa supermemory --limit=5

# Full benchmark run
bun run benchmark LongMemEval mem0

# Custom models for answering and judging
bun run benchmark LoCoMo supermemory --answeringModel=gpt-4o --judgeModel=gpt-4o

# Different evaluation methods for LoCoMo
bun run benchmark LoCoMo supermemory --evalMethod=exact    # Default: exact match
bun run benchmark LoCoMo supermemory --evalMethod=f1       # F1 token overlap
bun run benchmark LoCoMo supermemory --evalMethod=llm      # LLM-as-a-judge

# Mix model providers
bun run benchmark LongMemEval mem0 --answeringModel=claude-3-5-sonnet-20241022 --judgeModel=gpt-4o

# Skip phases (for resuming or re-evaluating)
bun run benchmark LongMemEval supermemory --skipIngest --skipSearch

# Formal run (for dashboard visualization)
bun run benchmark NoLiMa supermemory --formal --limit=50

# Continue an interrupted run
bun run benchmark LoCoMo fullcontext --continue
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--limit=<N>` | Limit number of test cases |
| `--continue` | Resume the most recent matching run |
| `--skipIngest` | Skip ingestion phase |
| `--skipSearch` | Skip search phase |
| `--skipEvaluate` | Skip evaluation phase |
| `--answeringModel=<model>` | Model for generating answers (default: `gpt-4o`) |
| `--judgeModel=<model>` | Model for judging answers (default: `gpt-4o`) |
| `--evalMethod=<method>` | LoCoMo evaluation: `exact`, `f1`, or `llm` |
| `--runId=<id>` | Custom run ID (auto-generated if not provided) |
| `--formal` | Mark run for dashboard visualization |
| `--topK=<N>` | Number of results to retrieve |

---

## Visualization Dashboard

View and compare benchmark results in an interactive web dashboard.

```bash
bun run viz
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Features

- **Multi-Benchmark Tabs**: Switch between NoLiMa, LongMemEval, and LoCoMo
- **Provider Filtering**: Toggle providers on/off
- **Interactive Charts**: Bar charts with dynamic Y-axis scaling
- **Performance Metrics**: API response times and throughput
- **Dataset Statistics**: Question distribution and metadata

### Results Location

```
results/{runId}/
├── checkpoints/              # Progress checkpoints (for resuming)
│   ├── ingest/
│   └── search/
├── search/                   # Raw search results with timing data
└── evaluation-summary.json   # Final evaluation metrics
```

---

## Adding New Providers

Providers are **auto-discovered** from the `providers/` directory. No registration required!

### Step 1: Create Provider Directory

```bash
mkdir -p providers/my-provider
```

### Step 2: Create Provider.ts

Create `providers/my-provider/Provider.ts`:

```typescript
import { 
    BaseProvider, 
    type ProviderConfig, 
    type IngestOptions, 
    type SearchOptions, 
    type SearchResult 
} from '../../core/providers/BaseProvider';

export default class MyProvider extends BaseProvider {
    // Store for your provider (or use external API)
    private client: any;

    constructor() {
        const config: ProviderConfig = {
            name: 'my-provider',           // Must match folder name
            requiresApiKey: true,          // Set to false if no API key needed
            apiKeyEnvVar: 'MY_PROVIDER_API_KEY',  // Environment variable name
            supportsMetadata: true,        // Can store metadata with content
            supportsChunking: false,       // Handles chunking internally
        };
        super(config);
        
        // Initialize your client
        this.client = new MyClient(process.env.MY_PROVIDER_API_KEY);
    }

    /**
     * Initialize provider (optional)
     * Called once before any operations
     */
    public async initialize(): Promise<void> {
        // Setup connections, warm up caches, etc.
        await this.client.connect();
    }

    /**
     * Ingest content into the provider
     * @param content - Text content to store
     * @param containerTag - Namespace/container identifier (unique per test)
     * @param options - Optional metadata
     */
    public async ingest(
        content: string,
        containerTag: string,
        options?: IngestOptions
    ): Promise<void> {
        await this.client.add({
            content,
            namespace: containerTag,
            metadata: options?.metadata,
        });
    }

    /**
     * Search for relevant content
     * @param query - Search query
     * @param containerTag - Namespace to search within
     * @param options - Search parameters (limit, threshold)
     * @returns Array of search results with scores
     */
    public async search(
        query: string,
        containerTag: string,
        options?: SearchOptions
    ): Promise<SearchResult[]> {
        const results = await this.client.search({
            query,
            namespace: containerTag,
            limit: options?.limit || 10,
            threshold: options?.threshold || 0.5,
        });

        // Transform to standard format
        return results.map((r: any) => ({
            id: r.id,
            content: r.text,
            score: r.similarity,
            metadata: r.metadata,
        }));
    }

    /**
     * Delete a container (optional)
     * Called after benchmark completes
     */
    public async deleteContainer(containerTag: string): Promise<void> {
        await this.client.deleteNamespace(containerTag);
    }

    /**
     * Cleanup resources (optional)
     */
    public async cleanup(): Promise<void> {
        await this.client.disconnect();
    }
}
```

### Step 3: Add Environment Variable

Add your API key to `.env`:

```bash
MY_PROVIDER_API_KEY=your_api_key_here
```

### Step 4: Run Benchmarks

Your provider is automatically available:

```bash
bun run benchmark NoLiMa my-provider --limit=5
```

### Provider Interface Reference

| Method | Required | Description |
|--------|----------|-------------|
| `constructor()` | Yes | Initialize config and client |
| `ingest(content, containerTag, options?)` | Yes | Store content in a namespace |
| `search(query, containerTag, options?)` | Yes | Search and return relevant content |
| `initialize()` | No | One-time setup before operations |
| `cleanup()` | No | Release resources when done |
| `prepareContainer(containerTag)` | No | Setup before using a container |
| `deleteContainer(containerTag)` | No | Remove a container and its data |

### SearchResult Format

```typescript
interface SearchResult {
    id: string;           // Unique identifier
    content: string;      // Retrieved text content
    score: number;        // Relevance score (0-1)
    metadata?: Record<string, any>;  // Optional metadata
}
```

---

## Adding New Benchmarks

### Benchmark Structure

```
benchmarks/
└── MyBenchmark/
    ├── runner/
    │   ├── index.ts      # Main orchestrator (required)
    │   ├── ingest.ts     # Ingestion logic
    │   ├── search.ts     # Search logic
    │   └── evaluate.ts   # Evaluation logic
    ├── datasets/         # Test data
    ├── types.ts          # TypeScript interfaces
    └── README.md         # Benchmark documentation
```

### Step 1: Create Benchmark Directory

```bash
mkdir -p benchmarks/MyBenchmark/runner
mkdir -p benchmarks/MyBenchmark/datasets
```

### Step 2: Define Types

Create `benchmarks/MyBenchmark/types.ts`:

```typescript
export interface TestCase {
    id: string;
    content: string;       // Content to ingest
    question: string;      // Question to ask
    expectedAnswer: string;
    metadata?: Record<string, any>;
}

export interface SearchResult {
    testId: string;
    query: string;
    retrievedContext: string;
    searchDurationMs: number;
    timestamp: string;
}

export interface EvaluationResult {
    testId: string;
    correct: boolean;
    predictedAnswer: string;
    expectedAnswer: string;
    score: number;
}
```

### Step 3: Create Runner

Create `benchmarks/MyBenchmark/runner/index.ts`:

```typescript
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getProviderRegistry } from '../../../core/providers/ProviderRegistry';

interface RunOptions {
    runId?: string;
    limit?: number;
    skipIngest?: boolean;
    skipSearch?: boolean;
    skipEvaluate?: boolean;
    answeringModel?: string;
    judgeModel?: string;
    topK?: number;
}

function parseOptions(args: string[]): RunOptions {
    const options: RunOptions = {};
    
    for (const arg of args) {
        if (arg.startsWith('--runId=')) {
            options.runId = arg.split('=')[1];
        } else if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]!, 10);
        } else if (arg === '--skipIngest') {
            options.skipIngest = true;
        } else if (arg === '--skipSearch') {
            options.skipSearch = true;
        } else if (arg === '--skipEvaluate') {
            options.skipEvaluate = true;
        } else if (arg.startsWith('--answeringModel=')) {
            options.answeringModel = arg.split('=')[1];
        } else if (arg.startsWith('--judgeModel=')) {
            options.judgeModel = arg.split('=')[1];
        } else if (arg.startsWith('--topK=')) {
            options.topK = parseInt(arg.split('=')[1]!, 10);
        }
    }
    
    return options;
}

export async function runMyBenchmark(providerName: string, args: string[]) {
    const options = parseOptions(args);
    const runId = options.runId || `mybenchmark-${Date.now()}`;
    const resultsDir = join(process.cwd(), 'results', runId);
    
    // Create results directory
    if (!existsSync(resultsDir)) {
        mkdirSync(resultsDir, { recursive: true });
    }

    console.log('=================================');
    console.log('   MyBenchmark Runner');
    console.log('=================================');
    console.log(`Provider: ${providerName}`);
    console.log(`Run ID: ${runId}`);
    console.log('=================================\n');

    // Get provider instance
    const registry = getProviderRegistry();
    const provider = registry.get(providerName);
    await provider.initialize();

    try {
        // Phase 1: Ingest test data
        if (!options.skipIngest) {
            console.log('Phase 1: Ingesting test data...');
            await ingestPhase(provider, runId, options);
        }

        // Phase 2: Run searches
        if (!options.skipSearch) {
            console.log('Phase 2: Running searches...');
            await searchPhase(provider, runId, options);
        }

        // Phase 3: Evaluate results
        if (!options.skipEvaluate) {
            console.log('Phase 3: Evaluating results...');
            await evaluatePhase(runId, options);
        }

        console.log('\n✅ Benchmark completed successfully!');
        
    } finally {
        await provider.cleanup();
    }
}

async function ingestPhase(provider: any, runId: string, options: RunOptions) {
    // Load your test cases
    const testCases = loadTestCases(options.limit);
    
    for (const testCase of testCases) {
        const containerTag = `${runId}_${testCase.id}`;
        await provider.ingest(testCase.content, containerTag);
    }
}

async function searchPhase(provider: any, runId: string, options: RunOptions) {
    const testCases = loadTestCases(options.limit);
    const searchResults = [];
    
    for (const testCase of testCases) {
        const containerTag = `${runId}_${testCase.id}`;
        const topK = options.topK || 5;
        
        const startTime = performance.now();
        const results = await provider.search(testCase.question, containerTag, { limit: topK });
        const searchDurationMs = performance.now() - startTime;
        
        searchResults.push({
            testId: testCase.id,
            query: testCase.question,
            retrievedContext: results.map(r => r.content).join('\n'),
            searchDurationMs,
            timestamp: new Date().toISOString(),
        });
    }
    
    // Save search results
    const searchDir = join(process.cwd(), 'results', runId, 'search');
    mkdirSync(searchDir, { recursive: true });
    writeFileSync(
        join(searchDir, 'results.json'),
        JSON.stringify(searchResults, null, 2)
    );
}

async function evaluatePhase(runId: string, options: RunOptions) {
    // Load search results and evaluate
    const searchDir = join(process.cwd(), 'results', runId, 'search');
    const searchResults = JSON.parse(
        readFileSync(join(searchDir, 'results.json'), 'utf-8')
    );
    
    // Use LLM to evaluate or implement your own logic
    const evaluationResults = [];
    let correct = 0;
    
    for (const result of searchResults) {
        // Your evaluation logic here
        const isCorrect = await evaluateAnswer(result, options);
        if (isCorrect) correct++;
        
        evaluationResults.push({
            testId: result.testId,
            correct: isCorrect,
            // ... other fields
        });
    }
    
    // Save evaluation summary
    const summary = {
        runId,
        totalTests: searchResults.length,
        correctAnswers: correct,
        accuracy: (correct / searchResults.length) * 100,
        timestamp: new Date().toISOString(),
    };
    
    writeFileSync(
        join(process.cwd(), 'results', runId, 'evaluation-summary.json'),
        JSON.stringify(summary, null, 2)
    );
    
    console.log(`\nAccuracy: ${summary.accuracy.toFixed(2)}%`);
}

function loadTestCases(limit?: number) {
    // Load from your datasets directory
    const dataPath = join(__dirname, '..', 'datasets', 'test-data.json');
    let testCases = JSON.parse(readFileSync(dataPath, 'utf-8'));
    
    if (limit) {
        testCases = testCases.slice(0, limit);
    }
    
    return testCases;
}

async function evaluateAnswer(result: any, options: RunOptions): Promise<boolean> {
    // Implement your evaluation logic
    // Can use exact match, F1 score, or LLM-as-a-judge
    return true;
}
```

### Step 4: Register the Benchmark

Edit `cli/run-benchmark.ts`:

```typescript
// Add to AVAILABLE_BENCHMARKS array
const AVAILABLE_BENCHMARKS = ['LongMemEval', 'LoCoMo', 'NoLiMa', 'MyBenchmark'];

// Add case in switch statement
switch (benchmarkName) {
    // ... existing cases ...
    
    case 'MyBenchmark':
        const { runMyBenchmark } = await import('../benchmarks/MyBenchmark/runner/index.ts');
        await runMyBenchmark(providerName, options);
        break;
}
```

### Step 5: Add Dashboard Support (Optional)

To show your benchmark in the visualization dashboard, update `viz/aggregator.ts`:

1. Add interface for your benchmark results
2. Add aggregation function
3. Update the main aggregation to include your benchmark

---

## Project Architecture

```
memorybench/
├── core/                     # Framework infrastructure
│   ├── providers/
│   │   ├── BaseProvider.ts   # Abstract base class for all providers
│   │   ├── ProviderLoader.ts # Auto-discovery and loading
│   │   └── ProviderRegistry.ts # Runtime provider registry
│   └── utils/
│       └── llm.ts            # LLM integration (OpenAI, Anthropic, Gemini)
│
├── providers/                # Provider implementations (auto-discovered)
│   ├── supermemory/
│   │   └── Provider.ts
│   ├── mem0/
│   │   └── Provider.ts
│   ├── langchain/
│   │   └── Provider.ts
│   └── fullcontext/
│       └── Provider.ts
│
├── benchmarks/               # Benchmark implementations
│   ├── NoLiMa/
│   │   ├── runner/           # Ingest, search, evaluate phases
│   │   ├── datasets/         # Test data files
│   │   └── types.ts
│   ├── LongMemEval/
│   └── LoCoMo/
│
├── cli/
│   └── run-benchmark.ts      # Main CLI entry point
│
├── viz/                      # Visualization dashboard
│   ├── server.ts             # Bun HTTP server
│   ├── dashboard.html        # Interactive UI
│   └── aggregator.ts         # Results aggregation
│
└── results/                  # Benchmark output (gitignored)
    └── {runId}/
        ├── checkpoints/
        ├── search/
        └── evaluation-summary.json
```

### Key Concepts

- **Providers**: Implement `BaseProvider` to add new memory systems
- **Benchmarks**: Three-phase pattern: Ingest → Search → Evaluate
- **Container Tags**: Unique namespace per test case to isolate data
- **Checkpointing**: Automatic progress saving for resumable runs
- **Performance Tracking**: Search duration logged for each query

---

## Troubleshooting

### "Provider not found"

Ensure your provider follows the structure:
```
providers/{name}/Provider.ts
```
The file must export a default class extending `BaseProvider`.

### "API key missing"

Add the required environment variable to `.env`:
```bash
MY_PROVIDER_API_KEY=your_key_here
```

### "Dataset not found"

Follow the dataset preparation steps for the specific benchmark.

### Rate Limiting

The system includes automatic retry with exponential backoff. If you hit limits frequently:

```bash
# Use a model with higher rate limits
bun run benchmark LoCoMo fullcontext --answeringModel=gpt-4o-mini

# Limit retrieved context
bun run benchmark LoCoMo fullcontext --topK=5

# Process smaller batches
bun run benchmark LoCoMo fullcontext --limit=5
```

### Resume Interrupted Runs

```bash
# Auto-find and resume the most recent matching run
bun run benchmark LoCoMo fullcontext --continue

# Or specify the exact run ID
bun run benchmark LongMemEval supermemory --runId=LongMemEval_supermemory_20251223_143022
```

---

## License

MIT
