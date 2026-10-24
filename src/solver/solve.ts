import Cube from 'cubejs';
import { parseMoves } from '../cube';
import type { Move } from '../cube';
import { isFaceletString } from './protocol';

export interface SolveComputation {
  notation: string;
  moves: Move[];
  computeMs: number;
}

export function initSolver(): number {
  const startedAt = performance.now();
  Cube.initSolver();
  return performance.now() - startedAt;
}

/**
 * The Solver Worker's pure adapter. It validates Facelets, computes a fresh
 * Kociemba Solution, and verifies that Solution before returning it.
 */
export function solveFacelets(facelets: string): SolveComputation {
  if (!isFaceletString(facelets)) {
    throw new Error(
      'Facelets must be 54 characters from U, R, F, D, L and B.',
    );
  }

  const startedAt = performance.now();
  const cube = Cube.fromString(facelets);
  const notation = cube.solve().trim();
  const computeMs = performance.now() - startedAt;

  if (notation) {
    const verification = Cube.fromString(facelets);
    verification.move(notation);
    if (!verification.isSolved()) {
      throw new Error(
        'The Solver returned a Solution that does not solve the Cube State.',
      );
    }
  } else if (!cube.isSolved()) {
    throw new Error(
      'The Solver returned an empty Solution for a scrambled Cube State.',
    );
  }

  return { notation, moves: parseMoves(notation), computeMs };
}
