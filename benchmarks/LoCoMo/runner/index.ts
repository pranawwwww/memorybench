/**
 * LoCoMo Benchmark Runner
 * Main orchestrator for the LoCoMo long-term conversational memory benchmark
 */

import { ingestAllSamples } from './ingest';
import { searchAllSamples } from './search';
import { evaluateAllSamples } from './evaluate';

interface RunOptions {
    runId?: string;
    skipIngest?: boolean;
    skipSearch?: boolean;
    skipEvaluate?: boolean;
    answeringModel?: string;
    judgeModel?: string;
    startPosition?: number;
    endPosition?: number;
    limit?: number;
    topK?: number;
    sessionDelay?: number;
}

function parseOptions(args: string[]): RunOptions {
    const options: RunOptions = {
        skipIngest: false,
        skipSearch: false,
        skipEvaluate: false,
    };

    for (const arg of args) {
        if (arg.startsWith('--runId=')) {
            options.runId = arg.split('=')[1];
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
        } else if (arg.startsWith('--startPosition=')) {
            options.startPosition = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--endPosition=')) {
            options.endPosition = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]!, 10);
        } else if (arg.startsWith('--topK=')) {
            options.topK = parseInt(arg.split('=')[1]!, 10);
        } else if (arg.startsWith('--sessionDelay=')) {
            options.sessionDelay = parseInt(arg.split('=')[1]!, 10);
        }
    }

    return options;
}

export async function runLoCoMo(
    providerName: string,
    args: string[]
) {
    const options = parseOptions(args);

    const runId = options.runId || `locomo-${Date.now()}`;
    const answeringModel = options.answeringModel || 'gpt-4o';

    // Convert --limit to startPosition/endPosition if provided
    if (options.limit && !options.startPosition && !options.endPosition) {
        options.startPosition = 1;
        options.endPosition = options.limit;
    }

    console.log('=================================');
    console.log('   LoCoMo Benchmark Runner');
    console.log('=================================');
    console.log(`Provider: ${providerName}`);
    console.log(`Run ID: ${runId}`);
    console.log(`Answering Model: ${answeringModel}`);
    if (options.judgeModel) {
        console.log(`Judge Model: ${options.judgeModel}`);
    }
    if (options.startPosition && options.endPosition) {
        console.log(`Sample Range: ${options.startPosition}-${options.endPosition}`);
    }
    console.log('=================================');
    console.log('');

    try {
        // Phase 1: Ingest conversation sessions
        if (!options.skipIngest) {
            console.log('Phase 1: Ingesting conversation sessions...');
            console.log('');
            await ingestAllSamples(providerName, runId, {
                startPosition: options.startPosition,
                endPosition: options.endPosition,
                sessionDelay: options.sessionDelay
            });
        } else {
            console.log('Phase 1: Skipped (--skipIngest)');
            console.log('');
        }

        // Phase 2: Search for relevant context
        if (!options.skipSearch) {
            console.log('Phase 2: Searching for relevant context...');
            console.log('');
            await searchAllSamples(providerName, runId, {
                startPosition: options.startPosition,
                endPosition: options.endPosition,
                topK: options.topK
            });
        } else {
            console.log('Phase 2: Skipped (--skipSearch)');
            console.log('');
        }

        // Phase 3: Evaluate answers
        if (!options.skipEvaluate) {
            console.log('Phase 3: Evaluating answers...');
            console.log('');
            await evaluateAllSamples(runId, answeringModel, {
                startPosition: options.startPosition,
                endPosition: options.endPosition,
                judgeModel: options.judgeModel
            });
        } else {
            console.log('Phase 3: Skipped (--skipEvaluate)');
            console.log('');
        }

        console.log('=================================');
        console.log('   LoCoMo Benchmark Complete!');
        console.log('=================================');
    } catch (error) {
        console.error('Error running LoCoMo benchmark:', error);
        throw error;
    }
}
