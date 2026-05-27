/// <reference lib="webworker" />
/**
 * Background worker for partisan draft-subtraction cheat analysis.
 *
 * Why a worker:
 *  - For partisan with P=20-22, k=4, evaluating a single pool pick may take
 *    several seconds (full minimax + α-β + transposition table). Doing this
 *    on the main thread freezes the UI even with setTimeout-based chunking.
 *  - Running in a worker means the UI thread stays fully responsive for the
 *    entire game session — user can draft, click buttons, scroll, etc.
 *  - The AI instance lives for the worker's lifetime, so the transposition
 *    table and killer-move heuristic accumulate across pool-pick evaluations
 *    AND across consecutive draft picks within a single game.
 *
 * Protocol:
 *   in:  { type: 'init',     config: DraftSubtractionConfig }
 *   in:  { type: 'evaluate', draft, value, batchId }
 *   out: { type: 'ready' }
 *   out: { type: 'result',   value, isWinning, batchId }
 *
 * Stale batch results (where batchId !== current main-thread batch) are
 * silently dropped by the main thread.
 */

import { DraftState, DraftSubtractionConfig } from '../../models/draft-subtraction/draft-subtraction.models';
import { DraftSubtractionAi } from './draft-subtraction.ai';

interface InitMessage {
  type: 'init';
  config: DraftSubtractionConfig;
}

interface EvaluateMessage {
  type: 'evaluate';
  draft: DraftState;
  value: number;
  batchId: number;
}

type IncomingMessage = InitMessage | EvaluateMessage;

let ai: DraftSubtractionAi | null = null;

addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    ai = new DraftSubtractionAi(msg.config);
    (postMessage as (m: unknown) => void)({ type: 'ready' });
    return;
  }

  if (msg.type === 'evaluate') {
    if (!ai) return;
    const isWinning = ai.isDraftPickWinningForCurrent(msg.draft, msg.value);
    (postMessage as (m: unknown) => void)({
      type: 'result',
      value: msg.value,
      isWinning,
      batchId: msg.batchId,
    });
  }
});
