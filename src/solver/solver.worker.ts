/// <reference lib="webworker" />
import { isFaceletString } from './protocol';
import type { SolveRequest, WorkerMessage } from './protocol';
import { initSolver, solveFacelets } from './solve';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

let initMs = 0;
let initError: string | null = null;

try {
  initMs = initSolver();
  post({ type: 'ready', initMs });
} catch (error) {
  initError = error instanceof Error ? error.message : String(error);
  post({
    type: 'init-error',
    reason: `Solver failed to initialize: ${initError}`,
  });
}

function post(message: WorkerMessage): void {
  workerScope.postMessage(message);
}

workerScope.onmessage = (event: MessageEvent<SolveRequest>) => {
  const request = event.data;

  if (request?.type !== 'solve' || typeof request.facelets !== 'string') {
    return;
  }

  if (initError) {
    post({
      type: 'error',
      id: request.id,
      reason: `Solver is unavailable: ${initError}`,
    });
    return;
  }

  if (!isFaceletString(request.facelets)) {
    post({
      type: 'invalid',
      id: request.id,
      reason: 'Facelets must be 54 characters from U, R, F, D, L and B.',
    });
    return;
  }

  try {
    const result = solveFacelets(request.facelets);
    post({
      type: 'solved',
      id: request.id,
      notation: result.notation,
      moves: result.moves,
      computeMs: result.computeMs,
      initMs,
    });
  } catch (error) {
    post({
      type: 'error',
      id: request.id,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};
