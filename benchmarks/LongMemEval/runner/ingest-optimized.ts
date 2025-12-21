/**
 * OPTIMIZED Ingestion module for LongMemEval
 * Reduces API calls through batching and parallel processing
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Dynamic provider imports
async function getProviderBatchIngest(providerName: string) {
    if (providerName === 'supermemory') {
        const { batchIngestContent } = await import('../../../providers/supermemory/src/batch-ingest');
        return batchIngestContent;
    } else {
        // Fallback to single ingest for providers without batch support
        return null;
    }
}

async function getProviderIngest(providerName: string) {
    if (providerName === 'supermemory') {
        const { ingestContent } = await import('../../../providers/supermemory/src/ingest');
        return ingestContent;
    } else if (providerName === 'mem0') {
        const { ingestContent } = await import('../../../providers/mem0/src/ingest');
        return ingestContent;
    } else if (providerName === 'zep') {
        const { ingestContent } = await import('../../../providers/zep/src/ingest');
        return ingestContent;
    } else {
        throw new Error(`Provider ${providerName} not supported for ingestion`);
    }
}

interface IngestOptions {
    startPosition?: number;
    endPosition?: number;
    batchSize?: number; // NEW: Enable batch processing
    sessionDelay?: number; // NEW: Configurable delay (ms)
}

interface SessionCheckpoint {
    index: number;
    date: string;
    ingested: boolean;
    timestamp?: string;
    error?: string;
}

interface QuestionCheckpoint {
    questionId: string;
    runId: string;
    containerTag: string;
    sessions: SessionCheckpoint[];
}

export async function ingestAllQuestionsOptimized(
    providerName: string,
    runId: string,
    questionType: string,
    options?: IngestOptions
) {
    console.log(`[OPTIMIZED] Ingesting ${questionType} questions...`);
    console.log(`Provider: ${providerName}`);
    console.log(`Run ID: ${runId}`);
    if (options?.batchSize) {
        console.log(`Batch Size: ${options.batchSize}`);
    }
    console.log('');

    // Get all question files of this type
    const questionsDir = join(process.cwd(), 'benchmarks/LongMemEval/datasets/questions');
    const allFiles = readdirSync(questionsDir).filter(f => f.endsWith('.json'));

    const questionFiles = allFiles.filter(filename => {
        const filePath = join(questionsDir, filename);
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        return data.question_type === questionType;
    });

    if (questionFiles.length === 0) {
        console.log(`No questions found for type: ${questionType}`);
        return;
    }

    console.log(`Found ${questionFiles.length} questions of type ${questionType}`);

    // Apply position filtering if provided
    let filesToProcess = questionFiles;
    if (options?.startPosition && options?.endPosition) {
        const start = options.startPosition - 1;
        const end = options.endPosition;
        filesToProcess = questionFiles.slice(start, end);
        console.log(`Processing positions ${options.startPosition}-${options.endPosition}: ${filesToProcess.length} questions`);
    }

    console.log('');

    // Check if batch ingestion is available
    const batchIngest = await getProviderBatchIngest(providerName);
    const useBatch = batchIngest && options?.batchSize && options.batchSize > 1;

    let successCount = 0;
    let failedCount = 0;

    if (useBatch) {
        // OPTIMIZED: Batch processing mode
        console.log(`Using batch mode (${options.batchSize} concurrent sessions)`);
        for (let i = 0; i < filesToProcess.length; i++) {
            const filename = filesToProcess[i];
            const questionId = filename.replace('.json', '');

            console.log(`[${i + 1}/${filesToProcess.length}] Processing ${questionId}...`);

            try {
                await ingestSingleQuestionBatch(questionId, runId, questionsDir, providerName, batchIngest!, options);
                successCount++;
                console.log(`  ✓ Success`);

                if (i < filesToProcess.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, options.sessionDelay || 2000));
                }
            } catch (error) {
                failedCount++;
                console.error(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            console.log('');
        }
    } else {
        // Standard processing mode (unchanged)
        const ingestContent = await getProviderIngest(providerName);
        for (let i = 0; i < filesToProcess.length; i++) {
            const filename = filesToProcess[i];
            const questionId = filename.replace('.json', '');

            console.log(`[${i + 1}/${filesToProcess.length}] Processing ${questionId}...`);

            try {
                await ingestSingleQuestion(questionId, runId, questionsDir, providerName, ingestContent, options);
                successCount++;
                console.log(`  ✓ Success`);

                if (i < filesToProcess.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, options?.sessionDelay || 2000));
                }
            } catch (error) {
                failedCount++;
                console.error(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            console.log('');
        }
    }

    console.log('Ingestion Summary:');
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed: ${failedCount}`);
    console.log(`  Total: ${filesToProcess.length}`);
    console.log('');
}

// OPTIMIZED: Batch ingestion for a single question
async function ingestSingleQuestionBatch(
    questionId: string,
    runId: string,
    questionsDir: string,
    providerName: string,
    batchIngest: any,
    options?: IngestOptions
) {
    const questionFilePath = join(questionsDir, `${questionId}.json`);
    const data = JSON.parse(readFileSync(questionFilePath, 'utf8'));

    const haystackDates = data.haystack_dates;
    const haystackSessions = data.haystack_sessions;
    const containerTag = `${questionId}-${runId}`;

    // Setup checkpoint
    const checkpointDir = join(process.cwd(), 'benchmarks/LongMemEval/checkpoints/ingest/session');
    if (!existsSync(checkpointDir)) {
        mkdirSync(checkpointDir, { recursive: true });
    }

    const checkpointPath = join(checkpointDir, `checkpoint-${questionId}-${runId}.json`);
    let checkpoint: QuestionCheckpoint;

    if (existsSync(checkpointPath)) {
        checkpoint = JSON.parse(readFileSync(checkpointPath, 'utf8'));
    } else {
        const numberOfSessions = Math.min(haystackDates.length, haystackSessions.length);
        checkpoint = {
            questionId,
            runId,
            containerTag,
            sessions: []
        };

        for (let i = 0; i < numberOfSessions; i++) {
            checkpoint.sessions.push({
                index: i,
                date: haystackDates[i],
                ingested: false
            });
        }
    }

    // Collect sessions to ingest in batch
    const batchItems: any[] = [];
    const sessionsToUpdate: number[] = [];

    for (let i = 0; i < checkpoint.sessions.length; i++) {
        const session = checkpoint.sessions[i];
        if (!session || session.ingested) continue;

        const sessionStr = JSON.stringify(haystackSessions[i])
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const content = `Here is the date the following session took place: ${JSON.stringify(haystackDates[i])}

Here is the session as a stringified JSON:
${sessionStr}`;

        batchItems.push({
            content,
            containerTag,
            metadata: {}
        });

        sessionsToUpdate.push(i);
    }

    if (batchItems.length === 0) {
        // All sessions already ingested
        return;
    }

    // Ingest all sessions in batch
    await batchIngest(batchItems);

    // Mark all sessions as ingested
    for (const idx of sessionsToUpdate) {
        checkpoint.sessions[idx]!.ingested = true;
        checkpoint.sessions[idx]!.timestamp = new Date().toISOString();
    }

    // Save checkpoint once after batch
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

// Standard single-session ingestion (unchanged logic)
async function ingestSingleQuestion(
    questionId: string,
    runId: string,
    questionsDir: string,
    providerName: string,
    ingestContent: any,
    options?: IngestOptions
) {
    const questionFilePath = join(questionsDir, `${questionId}.json`);
    const data = JSON.parse(readFileSync(questionFilePath, 'utf8'));

    const haystackDates = data.haystack_dates;
    const haystackSessions = data.haystack_sessions;
    const containerTag = `${questionId}-${runId}`;

    const checkpointDir = join(process.cwd(), 'benchmarks/LongMemEval/checkpoints/ingest/session');
    if (!existsSync(checkpointDir)) {
        mkdirSync(checkpointDir, { recursive: true });
    }

    const checkpointPath = join(checkpointDir, `checkpoint-${questionId}-${runId}.json`);
    let checkpoint: QuestionCheckpoint;

    if (existsSync(checkpointPath)) {
        checkpoint = JSON.parse(readFileSync(checkpointPath, 'utf8'));
    } else {
        const numberOfSessions = Math.min(haystackDates.length, haystackSessions.length);
        checkpoint = {
            questionId,
            runId,
            containerTag,
            sessions: []
        };

        for (let i = 0; i < numberOfSessions; i++) {
            checkpoint.sessions.push({
                index: i,
                date: haystackDates[i],
                ingested: false
            });
        }
    }

    const numberOfSessions = checkpoint.sessions.length;
    let sessionSuccessCount = 0;

    for (let i = 0; i < numberOfSessions; i++) {
        const session = checkpoint.sessions[i];
        if (!session) continue;

        if (session.ingested) {
            sessionSuccessCount++;
            continue;
        }

        try {
            const sessionStr = JSON.stringify(haystackSessions[i])
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            const content = `Here is the date the following session took place: ${JSON.stringify(haystackDates[i])}

Here is the session as a stringified JSON:
${sessionStr}`;

            await ingestContent(content, containerTag);

            session.ingested = true;
            session.timestamp = new Date().toISOString();
            sessionSuccessCount++;

            writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

            if (i < numberOfSessions - 1) {
                await new Promise(resolve => setTimeout(resolve, options?.sessionDelay || 10000));
            }
        } catch (error) {
            session.error = error instanceof Error ? error.message : String(error);
            writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
            throw new Error(`Failed at session ${i + 1}/${numberOfSessions}: ${session.error}`);
        }
    }

    if (sessionSuccessCount !== numberOfSessions) {
        throw new Error(`Only ${sessionSuccessCount}/${numberOfSessions} sessions ingested`);
    }
}
