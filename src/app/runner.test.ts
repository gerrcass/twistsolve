import { describe, expect, it } from 'vitest';
import {
  applyMoves,
  createSolvedCube,
  generateScramble,
  invertMoves,
  isSolved,
} from '../cube';
import type { Move, RandomSource } from '../cube';
import {
  createRunnerState,
  isBusyPhase,
  runnerReducer,
} from './runner';
import type { RunnerState } from './runner';

function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function commit(
  state: RunnerState,
  moves: readonly Move[],
  source: 'scramble' | 'solution' | 'manual',
): RunnerState {
  return moves.reduce(
    (next, move) =>
      runnerReducer(next, { type: 'move-commit', move, source }),
    state,
  );
}

describe('runnerReducer', () => {
  it('starts at the Solved State', () => {
    const state = createRunnerState();
    expect(state.phase).toBe('idle');
    expect(isSolved(state.cube)).toBe(true);
    expect(state.scramble).toHaveLength(0);
    expect(state.solution).toHaveLength(0);
    expect(isBusyPhase(state.phase)).toBe(false);
  });

  it('runs a Scramble to the scrambled phase', () => {
    const moves = generateScramble(25, mulberry32(11));
    let state = runnerReducer(createRunnerState(), {
      type: 'scramble-start',
      moves,
    });

    expect(state.phase).toBe('scrambling');
    state = commit(state, moves, 'scramble');
    state = runnerReducer(state, { type: 'queue-finished', source: 'scramble' });

    expect(state.phase).toBe('scrambled');
    expect(state.scramble).toHaveLength(25);
    expect(isSolved(state.cube)).toBe(false);
    expect(state.active).toBeNull();
  });

  it('records a Solve Receipt and reaches the Solved State', () => {
    const scramble = generateScramble(20, mulberry32(9));
    const scrambled = applyMoves(createSolvedCube(), scramble);
    const solution = invertMoves(scramble);

    let state = runnerReducer(createRunnerState(), {
      type: 'scramble-start',
      moves: scramble,
    });
    state = commit(state, scramble, 'scramble');
    state = runnerReducer(state, { type: 'queue-finished', source: 'scramble' });

    state = runnerReducer(state, {
      type: 'solution-start',
      moves: solution,
      receipt: {
        moveCount: solution.length,
        computeMs: 12,
        initMs: 1600,
        method: 'Kociemba two-phase',
      },
    });
    expect(state.phase).toBe('playing');
    expect(state.receipt?.moveCount).toBe(20);

    state = commit(state, solution, 'solution');
    state = runnerReducer(state, { type: 'queue-finished', source: 'solution' });

    expect(state.phase).toBe('solved');
    expect(isSolved(state.cube)).toBe(true);
    expect(state.receipt).not.toBeNull();
    expect(scrambled).not.toBe(state.cube);
  });

  it('clears the old run when a manual turn starts', () => {
    let state = runnerReducer(createRunnerState(), {
      type: 'scramble-start',
      moves: [{ face: 'R', amount: 1 }],
    });
    state = commit(state, [{ face: 'R', amount: 1 }], 'scramble');
    state = runnerReducer(state, { type: 'queue-finished', source: 'scramble' });

    state = runnerReducer(state, { type: 'manual-start' });
    expect(state.phase).toBe('turning');
    expect(state.scramble).toHaveLength(0);
    expect(state.solution).toHaveLength(0);

    state = commit(state, [{ face: 'U', amount: 1 }], 'manual');
    state = runnerReducer(state, { type: 'queue-finished', source: 'manual' });
    expect(state.phase).toBe('custom');
  });

  it('returns to idle when a manual turn solves the cube', () => {
    let state = runnerReducer(createRunnerState(), { type: 'manual-start' });
    state = commit(state, [{ face: 'R', amount: 1 }], 'manual');
    state = runnerReducer(state, { type: 'queue-finished', source: 'manual' });
    expect(state.phase).toBe('custom');

    state = runnerReducer(state, { type: 'manual-start' });
    state = commit(state, [{ face: 'R', amount: 3 }], 'manual');
    state = runnerReducer(state, { type: 'queue-finished', source: 'manual' });
    expect(state.phase).toBe('idle');
    expect(isSolved(state.cube)).toBe(true);
  });

  it('applies an instant run without animation', () => {
    const moves = generateScramble(25, mulberry32(4));
    let state = runnerReducer(createRunnerState(), {
      type: 'scramble-start',
      moves,
    });
    state = runnerReducer(state, {
      type: 'run-instantly',
      moves,
      source: 'scramble',
    });

    expect(state.phase).toBe('scrambled');
    expect(state.animation).toBeNull();
    expect(isSolved(state.cube)).toBe(false);
  });

  it('clears a previous Solution when a new Solve starts', () => {
    let state = runnerReducer(createRunnerState(), {
      type: 'solution-start',
      moves: [{ face: 'R', amount: 1 }],
      receipt: {
        moveCount: 1,
        computeMs: 1,
        initMs: 1,
        method: 'Kociemba two-phase',
      },
    });
    state = runnerReducer(state, { type: 'solve-start' });

    expect(state.phase).toBe('solving');
    expect(state.solution).toHaveLength(0);
    expect(state.receipt).toBeNull();
  });

  it('surfaces a recoverable Solver error', () => {
    const state = runnerReducer(
      runnerReducer(createRunnerState(), { type: 'solve-start' }),
      { type: 'solve-failed', message: 'Worker timed out' },
    );

    expect(state.phase).toBe('error');
    expect(state.error).toBe('Worker timed out');
    expect(isSolved(state.cube)).toBe(true);
  });

  it('resets while preserving preferences', () => {
    let state = runnerReducer(createRunnerState(), {
      type: 'set-speed',
      speed: 'fast',
    });
    state = runnerReducer(state, { type: 'set-modifier', modifier: 'prime' });
    state = runnerReducer(state, { type: 'scramble-start', moves: [] });
    state = runnerReducer(state, { type: 'reset' });

    expect(state.phase).toBe('idle');
    expect(state.speed).toBe('fast');
    expect(state.modifier).toBe('prime');
  });
});
