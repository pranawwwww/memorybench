# Memorybench - Unified Benchmark System

A unified benchmarking platform for testing memory providers with standardized benchmarks.

## Quick Start

### Prerequisites

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Configure Environment Variables**

   Create a `.env` file in the root directory:
   ```bash
   # Supermemory API (required for supermemory provider)
   SUPERMEMORY_API_KEY=your_api_key_here
   SUPERMEMORY_API_URL=https://api.supermemory.ai

   # Mem0 API (required for mem0 provider)
   MEM0_API_KEY=your_mem0_api_key_here
   MEM0_API_URL=https://api.mem0.ai/v1

   # Zep API (required for zep provider)
   ZEP_API_KEY=your_zep_api_key_here
   ZEP_API_URL=https://api.getzep.com

   # OpenAI API (required for evaluation/judging)
   OPENAI_API_KEY=your_openai_key_here

   # Google Vertex AI (required for evaluation with Gemini models)
   GOOGLE_VERTEX_PROJECT_ID=your_project_id
   GOOGLE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Prepare Dataset** (for LongMemEval)
   ```bash
   # Download longmemeval_s_cleaned.json from HuggingFace
   # https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned

   # Create dataset directory
   mkdir -p benchmarks/LongMemEval/datasets

   # Move downloaded file
   mv ~/Downloads/longmemeval_s_cleaned.json benchmarks/LongMemEval/datasets/

   # Split into individual questions
   cd benchmarks/LongMemEval
   bun run scripts/setup/split_questions.ts
   cd ../..
   ```

## Running Benchmarks

### Basic Usage

```bash
bun run benchmark <benchmark-name> <provider-name> --runId=<run-id> [options]
```

### Available Benchmarks
- `LongMemEval` - Long-term memory evaluation benchmark (6 question types, 500 questions)
- `LoCoMo` - Long-term conversational memory benchmark (10 samples, ~2000 questions)

### Available Providers
- `supermemory` - Supermemory API provider
- `mem0` - Mem0 memory system provider
- `zep` - Zep long-term memory store provider
- `AQRAG` - Question-augmented RAG provider
- `ContextualRetrieval` - Contextual retrieval provider

## LongMemEval Examples

### 1. Full Benchmark Run (All Question Types)

```bash
# Run with Supermemory
bun run benchmark LongMemEval supermemory --runId=full-run-1

# Run with Mem0
bun run benchmark LongMemEval mem0 --runId=full-run-1

# Run with Zep
bun run benchmark LongMemEval zep --runId=full-run-1
```

This will:
1. Ingest all questions (6 question types)
2. Search all questions
3. Evaluate using GPT-4o as the answering model
4. Generate comprehensive results with LLM-as-a-judge evaluation

### 2. Run Specific Question Types

```bash
bun run benchmark LongMemEval supermemory \
  --runId=single-session-test \
  --questionTypes=single-session-user,single-session-assistant
```

Available question types:
- `single-session-user` - Questions about user information from single session
- `single-session-assistant` - Questions about assistant responses from single session
- `single-session-preference` - Personalization questions from single session
- `knowledge-update` - Questions testing knowledge updates over time
- `temporal-reasoning` - Questions requiring temporal reasoning
- `multi-session` - Questions spanning multiple sessions

### 3. Run Subset of Questions

```bash
# Quick test with first 5 questions (shorthand)
bun run benchmark LongMemEval supermemory \
  --runId=quick-test \
  --limit=5

# Test specific range of questions
bun run benchmark LongMemEval supermemory \
  --runId=subset-test \
  --questionTypes=temporal-reasoning \
  --startPosition=1 \
  --endPosition=10
```

The `--limit=N` option is a shorthand for `--startPosition=1 --endPosition=N`.

### 4. Skip Phases (Resume Partial Runs)

```bash
# Skip ingestion (data already ingested)
bun run benchmark LongMemEval supermemory \
  --runId=existing-run \
  --skipIngest

# Skip ingestion and search (only evaluate)
bun run benchmark LongMemEval supermemory \
  --runId=existing-run \
  --skipIngest \
  --skipSearch

# Skip only evaluation
bun run benchmark LongMemEval supermemory \
  --runId=new-run \
  --skipEvaluate
```

### 5. Use Different Answering Models

```bash
# Use GPT-5 for answering
bun run benchmark LongMemEval supermemory \
  --runId=gpt5-test \
  --answeringModel=gpt-5

# Use Gemini 3 Pro
bun run benchmark LongMemEval supermemory \
  --runId=gemini-test \
  --answeringModel=gemini-3-pro-preview
```

Available answering models:
- `gpt-4o` (default)
- `gpt-5`
- `gemini-3-pro-preview`

Available judge models:
- `gpt-4o` (default)
- `gpt-4o-mini`
- `o1`
- `o1-mini`
- Any other OpenAI model

### 6. Use Different Judge Models

```bash
# Use o1 as the judge model
bun run benchmark LongMemEval supermemory \
  --runId=o1-judge-test \
  --judgeModel=o1

# Use both custom answering and judge models
bun run benchmark LongMemEval supermemory \
  --runId=custom-models \
  --answeringModel=gpt-5 \
  --judgeModel=o1
```

### 7. Complete Example Workflow

```bash
# 1. Test with a small subset first (5 questions)
bun run benchmark LongMemEval supermemory \
  --runId=pilot-test \
  --limit=5

# 2. If successful, run full benchmark
bun run benchmark LongMemEval supermemory \
  --runId=production-run-1

# 3. Try different answering model
bun run benchmark LongMemEval supermemory \
  --runId=production-run-1 \
  --answeringModel=gpt-5 \
  --skipIngest \
  --skipSearch
```

## LoCoMo Examples

### 1. Quick Test (1 Sample)

```bash
# Test with first sample (~199 questions)
bun run benchmark LoCoMo supermemory \
  --runId=locomo-test \
  --limit=1
```

### 2. Full Benchmark Run (All 10 Samples)

```bash
# Run with Supermemory (~2000 questions total)
bun run benchmark LoCoMo supermemory --runId=locomo-full

# Run with Mem0
bun run benchmark LoCoMo mem0 --runId=locomo-full

# Run with Zep
bun run benchmark LoCoMo zep --runId=locomo-full
```

### 3. Use Different Models

```bash
# Use GPT-4o for answering and judging
bun run benchmark LoCoMo supermemory \
  --runId=locomo-gpt4o \
  --answeringModel=gpt-4o \
  --judgeModel=gpt-4o

# Use Gemini for answering, GPT-4o for judging
bun run benchmark LoCoMo supermemory \
  --runId=locomo-gemini \
  --answeringModel=gemini-1.5-pro \
  --judgeModel=gpt-4o
```

### 4. Resume Failed Runs

```bash
# Same runId will resume from checkpoint
bun run benchmark LoCoMo supermemory \
  --runId=locomo-interrupted \
  --limit=5
```

### LoCoMo-Specific Options

| Option | Description | Default |
|--------|-------------|---------|
| `--topK=<N>` | Number of context chunks to retrieve per question | 5 |
| `--sessionDelay=<ms>` | Delay between session ingestions (ms) | 10000 |

### Understanding LoCoMo Categories

- **Category 1: Factual** - Direct fact retrieval from conversations
- **Category 2: Temporal** - Time-based reasoning and temporal references
- **Category 3: Reasoning** - Inference and deduction from conversation history

For more details, see [LoCoMo README](benchmarks/LoCoMo/README.md).

## Understanding Results

### Directory Structure

```
benchmarks/LongMemEval/
├── checkpoints/          # Checkpoint files for resuming
│   ├── ingest/
│   │   ├── session/     # Per-question session checkpoints
│   │   └── batch/       # Batch ingestion checkpoints
│   └── search/
│       └── batch/       # Batch search checkpoints
├── results/              # Search results (questionId-runId.json)
└── evaluations/          # Evaluation results
    └── eval-{runId}-{model}-{type}-{range}.json
```

### Evaluation Output Format

```json
{
  "metadata": {
    "runId": "production-run-1",
    "model": "gpt-4o",
    "questionTypes": ["all"],
    "evaluatedAt": "2025-01-20T10:30:00Z",
    "totalQuestions": 150,
    "correctAnswers": 127,
    "accuracy": "84.67%"
  },
  "byQuestionType": [
    {
      "questionType": "single-session-user",
      "correct": 25,
      "total": 30,
      "accuracy": "83.33%"
    }
    // ... more types
  ],
  "evaluations": [
    {
      "questionId": "abc123",
      "questionType": "single-session-user",
      "question": "What is the user's favorite color?",
      "groundTruth": "blue",
      "hypothesis": "The user's favorite color is blue.",
      "label": 1,
      "explanation": "The response correctly identifies the favorite color."
    }
    // ... more evaluations
  ]
}
```

### Interpreting Results

- **label**: `1` = correct, `0` = incorrect
- **accuracy**: Overall percentage of correct answers
- **byQuestionType**: Breakdown showing performance on each question type
- **hypothesis**: The model's generated answer based on retrieved context
- **explanation**: Judge's reasoning for the label

## Checkpointing System

The system automatically saves progress at multiple levels:

1. **Session-level**: During ingestion, each session is checkpointed
2. **Question-level**: Each question's completion is tracked
3. **Evaluation-level**: Evaluation progress is saved incrementally

If a run fails or is interrupted, simply re-run the same command with the same `runId` and it will resume from the last checkpoint.

## Troubleshooting

### Common Issues

1. **"Questions directory not found"**
   - Run the dataset setup steps (download + split_questions.ts)

2. **"Missing required environment variables"**
   - Check your `.env` file has all required keys
   - Verify API keys are valid

3. **Rate Limiting**
   - The system includes automatic delays (10s between ingestion sessions, 1s between searches)
   - If you hit rate limits, the checkpoint system allows resuming

4. **Evaluation Errors**
   - Ensure OPENAI_API_KEY is set (required for judge)
   - For Gemini models, ensure GOOGLE_VERTEX_PROJECT_ID is configured

### Getting Help

Check the individual benchmark READMEs:
- [LongMemEval README](benchmarks/LongMemEval/README.md)
- [LoCoMo README](benchmarks/LoCoMo/README.md)

## Adding New Providers

To add a new provider:

1. Create directory: `providers/your-provider/`
2. Implement the provider interface (see `providers/_template/`)
3. Export from `providers/index.ts`
4. Add to `AVAILABLE_PROVIDERS` in `cli/run-benchmark.ts`

## Adding New Benchmarks

To add a new benchmark:

1. Create directory: `benchmarks/YourBenchmark/`
2. Create runner in `benchmarks/YourBenchmark/runner/index.ts`
3. Export a `runYourBenchmark()` function
4. Add to `AVAILABLE_BENCHMARKS` and route in `cli/run-benchmark.ts`

## Performance Tips

1. **Start Small**: Test with `--startPosition` and `--endPosition` first
2. **Use Checkpoints**: Don't restart from scratch if something fails
3. **Skip Phases**: Use `--skipIngest` or `--skipSearch` when re-running
4. **Parallel Runs**: You can run multiple `runId`s in parallel (different question types)
5. **Monitor Costs**: LLM evaluation can be expensive - test with small subsets first

## Citation

If you use LongMemEval in your research, please cite:
```
@article{longmemeval2024,
  title={LongMemEval: Benchmarking Long-term Memory in LLMs},
  author={...},
  journal={arXiv preprint},
  year={2024}
}
```
