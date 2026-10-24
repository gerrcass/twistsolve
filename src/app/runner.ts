import type { TurnAnimationState } from '../animation';
import { applyMove, applyMoves, createSolvedCube, isSolved } from '../cube';
import type { CubeState, Move } from '../cube';

export type Speed = 'slow' | 'normal' | 'fast';
export type TurnModifier = 'quarter' | 'prime' | 'half';

export type RunPhase =
  | 'idle'
  | 'scrambling'
  | 'scrambled'
  | 'turning'
  | 'solving'
  | 'playing'
  | 'solved'
  | 'custom'
  | 'error';

export type MoveSource = 'scramble' | 'solution' | 'manual';

export interface SolveReceipt {
  moveCount: number;
  computeMs: number;
  initMs: number;
  method: 'Kociemba two-phase';
}

export interface ActiveMove {
  source: MoveSource;
  index: number;
}

export interface RunnerState {
  cube: CubeState;
  phase: RunPhase;
  scramble: Move[];
  solution: Move[];
  active: ActiveMove | null;
  receipt: SolveReceipt | null;
  error: string | null;
  animation: TurnAnimationState | null;
  speed: Speed;
  modifier: TurnModifier;
}

export type RunnerAction =
  | { type: 'scramble-start'; moves: Move[] }
  | { type: 'solve-start' }
  | { type: 'solve-failed'; message: string }
  | {
      type: 'solution-start';
      moves: Move[];
      receipt: SolveReceipt;
    }
  | { type: 'manual-start' }
  | { type: 'move-start'; animation: TurnAnimationState; active: ActiveMove }
  | { type: 'move-commit'; move: Move; source: MoveSource }
  | { type: 'queue-finished'; source: MoveSource }
  | { type: 'run-instantly'; moves: Move[]; source: MoveSource }
  | { type: 'reset' }
  | { type: 'set-speed'; speed: Speed }
  | { type: 'set-modifier'; modifier: TurnModifier };

export function createRunnerState(): RunnerState {
  return {
    cube: createSolvedCube(),
    phase: 'idle',
    scramble: [],
    solution: [],
    active: null,
    receipt: null,
    error: null,
    animation: null,
    speed: 'normal',
    modifier: 'quarter',
  };
}

function finishPhase(cube: CubeState): RunPhase {
  return isSolved(cube) ? 'idle' : 'custom';
}

export function runnerReducer(
  state: RunnerState,
  action: RunnerAction,
): RunnerState {
  switch (action.type) {
    case 'scramble-start':
      return {
        ...state,
        cube: createSolvedCube(),
        phase: 'scrambling',
        scramble: action.moves,
        solution: [],
        active: null,
        receipt: null,
        error: null,
        animation: null,
      };

    case 'solve-start':
      return {
        ...state,
        phase: 'solving',
        error: null,
        receipt: null,
        solution: [],
        active: null,
        animation: null,
      };

    case 'solve-failed':
      return {
        ...state,
        phase: 'error',
        error: action.message,
        active: null,
        animation: null,
      };

    case 'solution-start':
      return {
        ...state,
        phase: 'playing',
        solution: action.moves,
        receipt: action.receipt,
        error: null,
        active: action.moves.length > 0 ? { source: 'solution', index: 0 } : null,
      };

    case 'manual-start':
      return {
        ...state,
        phase: 'turning',
        scramble: [],
        solution: [],
        active: null,
        receipt: null,
        error: null,
      };

    case 'move-start':
      return {
        ...state,
        animation: action.animation,
        active: action.active,
      };

    case 'move-commit':
      return {
        ...state,
        cube: applyMove(state.cube, action.move),
        animation: null,
      };

    case 'queue-finished': {
      if (action.source === 'solution') {
        return {
          ...state,
          phase: isSolved(state.cube) ? 'solved' : 'error',
          error: isSolved(state.cube)
            ? null
            : 'The Solution finished but the Cube State is not solved.',
          active: null,
          animation: null,
        };
      }

      if (action.source === 'scramble') {
        return {
          ...state,
          phase: 'scrambled',
          active: null,
          animation: null,
        };
      }

      return {
        ...state,
        phase: finishPhase(state.cube),
        active: null,
        animation: null,
      };
    }

    case 'run-instantly': {
      const cube = applyMoves(state.cube, action.moves);

      if (action.source === 'scramble') {
        return {
          ...state,
          cube,
          phase: 'scrambled',
          active: null,
          animation: null,
        };
      }

      if (action.source === 'solution') {
        const solved = isSolved(cube);
        return {
          ...state,
          cube,
          phase: solved ? 'solved' : 'error',
          error: solved
            ? null
            : 'The Solution finished but the Cube State is not solved.',
          active: null,
          animation: null,
        };
      }

      return {
        ...state,
        cube,
        phase: finishPhase(cube),
        active: null,
        animation: null,
      };
    }

    case 'reset':
      return {
        ...createRunnerState(),
        speed: state.speed,
        modifier: state.modifier,
      };

    case 'set-speed':
      return { ...state, speed: action.speed };

    case 'set-modifier':
      return { ...state, modifier: action.modifier };

    default:
      return state;
  }
}

export function isBusyPhase(phase: RunPhase): boolean {
  return (
    phase === 'scrambling' ||
    phase === 'turning' ||
    phase === 'solving' ||
    phase === 'playing'
  );
}
