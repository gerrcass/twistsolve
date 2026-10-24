import { useCallback, useEffect, useRef, useState } from 'react';
import { createSolverClient } from '../solver/client';
import type { SolverClient } from '../solver/client';
import type { SolverResult, SolverStatus } from '../solver/protocol';

export interface SolverHandle {
  status: SolverStatus;
  initMs: number | null;
  solve: (facelets: string) => Promise<SolverResult>;
}

export function useSolver(): SolverHandle {
  const [status, setStatus] = useState<SolverStatus>('warming');
  const [initMs, setInitMs] = useState<number | null>(null);
  const clientRef = useRef<SolverClient | null>(null);

  useEffect(() => {
    const client = createSolverClient((nextStatus, readyInitMs) => {
      setStatus(nextStatus);
      if (typeof readyInitMs === 'number') {
        setInitMs(readyInitMs);
      }
    });

    clientRef.current = client;

    return () => {
      client.dispose();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, []);

  const solve = useCallback((facelets: string): Promise<SolverResult> => {
    const client = clientRef.current;
    if (!client) {
      return Promise.reject(new Error('The Solver is still warming up.'));
    }
    return client.solve(facelets);
  }, []);

  return { status, initMs, solve };
}
