import type { SolverResult, SolverStatus, WorkerMessage } from './protocol';

export interface SolverClient {
  solve(facelets: string): Promise<SolverResult>;
  dispose(): void;
}

interface PendingSolve {
  resolve: (result: SolverResult) => void;
  reject: (error: Error) => void;
  timer: number;
}

const SOLVE_TIMEOUT_MS = 30_000;

export function createSolverClient(
  onStatus: (status: SolverStatus, initMs?: number) => void,
): SolverClient {
  let worker: Worker;
  try {
    worker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
      type: 'module',
      name: 'twistsolve-solver',
    });
  } catch {
    onStatus('error');
    return {
      solve: () => Promise.reject(new Error('The Solver Worker could not start.')),
      dispose: () => undefined,
    };
  }

  const pending = new Map<number, PendingSolve>();
  let nextId = 1;
  let disposed = false;

  function rejectAll(reason: string): void {
    for (const request of pending.values()) {
      window.clearTimeout(request.timer);
      request.reject(new Error(reason));
    }
    pending.clear();
  }

  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    if (message.type === 'ready') {
      onStatus('ready', message.initMs);
      return;
    }

    if (message.id < 0) {
      onStatus('error');
      rejectAll(message.type === 'error' ? message.reason : 'Solver failed.');
      return;
    }

    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    window.clearTimeout(request.timer);

    if (message.type === 'solved') {
      request.resolve({
        moves: [...message.moves],
        notation: message.notation,
        computeMs: message.computeMs,
        initMs: message.initMs,
      });
      return;
    }

    request.reject(
      new Error(
        message.type === 'invalid'
          ? `The Solver rejected this Cube State: ${message.reason}`
          : `The Solver failed: ${message.reason}`,
      ),
    );
  };

  worker.onerror = (event) => {
    onStatus('error');
    rejectAll(
      event.message
        ? `The Solver Worker crashed: ${event.message}`
        : 'The Solver Worker crashed.',
    );
  };

  return {
    solve(facelets: string): Promise<SolverResult> {
      if (disposed) {
        return Promise.reject(new Error('The Solver has been disposed.'));
      }

      const id = nextId;
      nextId += 1;

      return new Promise<SolverResult>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          pending.delete(id);
          reject(
            new Error(
              'The Solver did not find a Solution within 30 seconds. Please try again.',
            ),
          );
        }, SOLVE_TIMEOUT_MS);

        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ type: 'solve', id, facelets });
      });
    },

    dispose(): void {
      disposed = true;
      worker.terminate();
      rejectAll('The Solver has been disposed.');
    },
  };
}
