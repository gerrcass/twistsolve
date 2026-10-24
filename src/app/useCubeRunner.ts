import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  applyMoves,
  faceletString,
  generateScramble,
  isSolved,
} from '../cube';
import type { Amount, Face, Move } from '../cube';
import type { TurnAnimationState } from '../animation';
import type { SolverResult } from '../solver/protocol';
import {
  createRunnerState,
  isBusyPhase,
  runnerReducer,
} from './runner';
import type {
  MoveSource,
  RunnerAction,
  RunnerState,
  Speed,
  TurnModifier,
} from './runner';
import { useReducedMotion } from './useReducedMotion';

interface QueueItem {
  move: Move;
  source: MoveSource;
  index: number;
}

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
  const [state, dispatch] = useReducer(runnerReducer, undefined, createRunnerState);
  const reducedMotion = useReducedMotion();

  const stateRef = useRef(state);
  const speedRef = useRef(state.speed);
  const reducedRef = useRef(reducedMotion);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = state.speed;
    reducedRef.current = reducedMotion;
  }, [reducedMotion, state]);

  const queueRef = useRef<QueueItem[]>([]);
  const timerRef = useRef<number | null>(null);
  const moveTokenRef = useRef(0);
  const busyRef = useRef(false);
  const solveTokenRef = useRef(0);
  const stepRef = useRef<() => void>(() => undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const durationFor = useCallback((item: QueueItem): number => {
    const base = SPEED_DURATIONS[speedRef.current];
    const sourceFactor = item.source === 'scramble' ? SCRAMBLE_FACTOR : 1;
    const turnFactor = item.move.amount === 2 ? HALF_TURN_FACTOR : 1;
    return Math.round(base * sourceFactor * turnFactor);
  }, []);

  const finishQueue = useCallback(
    (source: MoveSource) => {
      busyRef.current = false;
      dispatch({ type: 'queue-finished', source });
    },
    [dispatch],
  );

  const commit = useCallback(
    (item: QueueItem, token: number) => {
      if (token !== moveTokenRef.current) return;

      dispatch({ type: 'move-commit', move: item.move, source: item.source });

      if (queueRef.current.length === 0) {
        finishQueue(item.source);
        return;
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        stepRef.current();
      }, MOVE_GAP_MS);
    },
    [dispatch, finishQueue],
  );

  const step = useCallback(() => {
    const item = queueRef.current.shift();
    if (!item) {
      busyRef.current = false;
      return;
    }

    const token = moveTokenRef.current + 1;
    moveTokenRef.current = token;
    const duration = durationFor(item);

    const animation: TurnAnimationState = {
      move: item.move,
      startedAt: performance.now(),
      duration,
      token,
    };

    dispatch({
      type: 'move-start',
      animation,
      active: { source: item.source, index: item.index },
    });

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      commit(item, token);
    }, duration);
  }, [commit, dispatch, durationFor]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const startAnimatedRun = useCallback(
    (moves: readonly Move[], source: MoveSource, setup: RunnerAction) => {
      busyRef.current = true;
      queueRef.current = moves.map((move, index) => ({
        move,
        source,
        index,
      }));
      dispatch(setup);
      stepRef.current();
    },
    [dispatch],
  );

  const cancelInFlight = useCallback(() => {
    solveTokenRef.current += 1;
    moveTokenRef.current += 1;
    clearTimer();
    queueRef.current = [];
    busyRef.current = false;
  }, [clearTimer]);

  useEffect(
    () => () => {
      cancelInFlight();
    },
    [cancelInFlight],
  );

  const scramble = useCallback(() => {
    if (busyRef.current || stateRef.current.phase === 'solving') return;

    cancelInFlight();
    const moves = generateScramble(25);
    dispatch({ type: 'scramble-start', moves });

    if (reducedRef.current) {
      dispatch({ type: 'run-instantly', moves, source: 'scramble' });
      return;
    }

    busyRef.current = true;
    queueRef.current = moves.map((move, index) => ({
      move,
      source: 'scramble',
      index,
    }));
    stepRef.current();
  }, [cancelInFlight, dispatch]);

  const solveCube = useCallback(async () => {
    const current = stateRef.current;
    if (busyRef.current || current.phase === 'solving') return;
    if (isSolved(current.cube)) return;

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

      startAnimatedRun(result.moves, 'solution', {
        type: 'solution-start',
        moves: result.moves,
        receipt,
      });
    } catch (error) {
      if (runId !== solveTokenRef.current) return;
      dispatch({
        type: 'solve-failed',
        message:
          error instanceof Error
            ? error.message
            : 'The Solver failed for an unknown reason.',
      });
    }
  }, [dispatch, solve, startAnimatedRun]);

  const reset = useCallback(() => {
    cancelInFlight();
    dispatch({ type: 'reset' });
  }, [cancelInFlight, dispatch]);

  const manualTurn = useCallback(
    (face: Face, explicitAmount?: Amount) => {
      if (busyRef.current || stateRef.current.phase === 'solving') return;

      cancelInFlight();
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

      busyRef.current = true;
      queueRef.current = [{ move, source: 'manual', index: 0 }];
      stepRef.current();
    },
    [cancelInFlight, dispatch],
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
