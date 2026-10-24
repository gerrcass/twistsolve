/// <reference lib="webworker" />
import Cube from 'cubejs';
import { parseMoves } from '../cube';
import { isFaceletString } from './protocol';
import type { SolveRequest, WorkerMessage } from './protocol';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

let initMs = 0;
let initError: string | null = null;

try {
  const startedAt = performance.now();
  Cube.initSolver();
  initMs = performance.now() - startedAt;
  post({ type: 'ready', initMs });
} catch (error) {
  initError = error instanceof Error ? error.message : String(error);
  post({ type: 'error', id: -1, reason: `Solver failed to initialize: ${initError}` });
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
    const startedAt = performance.now();
    const cube = Cube.fromString(request.facelets);
    const notation = cube.solve().trim();
    const computeMs = performance.now() - startedAt;

    if (notation) {
      const verification = Cube.fromString(request.facelets);
      verification.move(notation);
      if (!verification.isSolved()) {
        post({
          type: 'error',
          id: request.id,
          reason: 'The Solver returned a Solution that does not solve the Cube State.',
        });
        return;
      }
    } else if (!cube.isSolved()) {
      post({
        type: 'error',
        id: request.id,
        reason: 'The Solver returned an empty Solution for a scrambled Cube State.',
      });
      return;
    }

    const moves = parseMoves(notation);
    post({
      type: 'solved',
      id: request.id,
      notation,
      moves,
      computeMs,
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
