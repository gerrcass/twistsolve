import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  applyMoves,
  faceletString,
  generateScramble,
  isSolved,
} from '../cube';
import type { Amount, Face, Move } from '../cube';
import type { SolverResult } from '../solver/protocol';
import { MoveScheduler } from './moveScheduler';
import {
  createRunnerState,
  isBusyPhase,
  runnerReducer,
} from './runner';
import type { RunnerState, Speed, TurnModifier } from './runner';
import { useReducedMotion } from './useReducedMotion';

interface UseCubeRunnerOptions {
  solve: (facelets: string) => Promise<SolverResult>;
}

const SPEED_DURATIONS: Record<Speed, number> = {
  slow: 430,
  normal: 230,
  fast: 120,
};

const SCRAMBLE_FACTOR = 0.55;
const HALF_TURN_FACTOR = 1.45;
const MOVE_GAP_MS = 42;

export interface CubeRunner {
  state: RunnerState;
  busy: boolean;
  solved: boolean;
  canScramble: boolean;
  canSolve: boolean;
  canReset: boolean;
  canManualTurn: boolean;
  scramble: () => void;
  solve: () => Promise<void>;
  reset: () => void;
  manualTurn: (face: Face, amount?: Amount) => void;
  setSpeed: (speed: Speed) => void;
  setModifier: (modifier: TurnModifier) => void;
}

export function useCubeRunner({ solve }: UseCubeRunnerOptions): CubeRunner {
  const [state, dispatch] = useReducer(
    runnerReducer,
    undefined,
    createRunnerState,
  );
  const reducedMotion = useReducedMotion();

  const stateRef = useRef(state);
  const speedRef = useRef(state.speed);
  const reducedRef = useRef(reducedMotion);
  const solveTokenRef = useRef(0);
  const solveInFlightRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = state.speed;
    reducedRef.current = reducedMotion;
  }, [reducedMotion, state]);

  const [scheduler, setScheduler] = useState<MoveScheduler | null>(null);

  useEffect(() => {
    const created = new MoveScheduler(
      {
        onStart: (animation, active) =>
          dispatch({ type: 'move-start', animation, active }),
        onCommit: (move, source) =>
          dispatch({ type: 'move-commit', move, source }),
        onFinish: (source) => dispatch({ type: 'queue-finished', source }),
      },
      {
        durationFor: (item) => {
          const base = SPEED_DURATIONS[speedRef.current];
          const sourceFactor = item.source === 'scramble' ? SCRAMBLE_FACTOR : 1;
          const turnFactor = item.move.amount === 2 ? HALF_TURN_FACTOR : 1;
          return Math.round(base * sourceFactor * turnFactor);
        },
        gapMs: MOVE_GAP_MS,
      },
    );

    setScheduler(created);
    return () => created.cancel();
  }, [dispatch]);

  const cancelInFlightSolve = useCallback(() => {
    solveTokenRef.current += 1;
    solveInFlightRef.current = false;
  }, []);

  useEffect(
    () => () => {
      cancelInFlightSolve();
    },
    [cancelInFlightSolve],
  );

  const scramble = useCallback(() => {
    if (!scheduler || scheduler.isBusy || stateRef.current.phase === 'solving') {
      return;
    }

    cancelInFlightSolve();
    const moves = generateScramble(25);
    dispatch({ type: 'scramble-start', moves });

    if (reducedRef.current) {
      dispatch({ type: 'run-instantly', moves, source: 'scramble' });
      return;
    }

    scheduler.start(moves, 'scramble');
  }, [cancelInFlightSolve, dispatch, scheduler]);

  const solveCube = useCallback(async () => {
    if (!scheduler || scheduler.isBusy || solveInFlightRef.current) return;

    const current = stateRef.current;
    if (current.phase === 'solving' || isSolved(current.cube)) return;

    solveInFlightRef.current = true;
    const runId = solveTokenRef.current + 1;
    solveTokenRef.current = runId;
    dispatch({ type: 'solve-start' });

    try {
      const result = await solve(faceletString(current.cube));
      if (runId !== solveTokenRef.current) return;

      const verified = applyMoves(current.cube, result.moves);
      if (!isSolved(verified)) {
        throw new Error(
          'The Solver returned a Solution that does not reach the Solved State.',
        );
      }

      const receipt = {
        moveCount: result.moves.length,
        computeMs: result.computeMs,
        initMs: result.initMs,
        method: 'Kociemba two-phase' as const,
      };

      if (reducedRef.current) {
        dispatch({ type: 'solution-start', moves: result.moves, receipt });
        dispatch({
          type: 'run-instantly',
          moves: result.moves,
          source: 'solution',
        });
        return;
      }

      dispatch({ type: 'solution-start', moves: result.moves, receipt });
      if (!scheduler.start(result.moves, 'solution')) {
        dispatch({
          type: 'solve-failed',
          message: 'The Move Queue was busy when the Solution arrived.',
        });
      }
    } catch (error) {
      if (runId !== solveTokenRef.current) return;
      dispatch({
        type: 'solve-failed',
        message:
          error instanceof Error
            ? error.message
            : 'The Solver failed for an unknown reason.',
      });
    } finally {
      solveInFlightRef.current = false;
    }
  }, [dispatch, scheduler, solve]);

  const reset = useCallback(() => {
    cancelInFlightSolve();
    scheduler?.cancel();
    dispatch({ type: 'reset' });
  }, [cancelInFlightSolve, dispatch, scheduler]);

  const manualTurn = useCallback(
    (face: Face, explicitAmount?: Amount) => {
      if (!scheduler || scheduler.isBusy || stateRef.current.phase === 'solving') {
        return;
      }

      cancelInFlightSolve();
      const { modifier } = stateRef.current;
      const move: Move = {
        face,
        amount:
          explicitAmount ??
          (modifier === 'half' ? 2 : modifier === 'prime' ? 3 : 1),
      };

      dispatch({ type: 'manual-start' });

      if (reducedRef.current) {
        dispatch({ type: 'run-instantly', moves: [move], source: 'manual' });
        return;
      }

      scheduler.start([move], 'manual');
    },
    [cancelInFlightSolve, dispatch, scheduler],
  );

  const setSpeed = useCallback(
    (speed: Speed) => dispatch({ type: 'set-speed', speed }),
    [dispatch],
  );

  const setModifier = useCallback(
    (modifier: TurnModifier) => dispatch({ type: 'set-modifier', modifier }),
    [dispatch],
  );

  const busy = isBusyPhase(state.phase);
  const solved = isSolved(state.cube);

  return {
    state,
    busy,
    solved,
    canScramble: !busy,
    canSolve: !busy && !solved,
    canReset: busy || state.phase !== 'idle',
    canManualTurn: !busy,
    scramble,
    solve: solveCube,
    reset,
    manualTurn,
    setSpeed,
    setModifier,
  };
}
