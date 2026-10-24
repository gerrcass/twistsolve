import { beforeAll, describe, expect, it } from 'vitest';
import {
  applyMoves,
  createSolvedCube,
  faceletString,
  generateScramble,
  invertMoves,
  isSolved,
  movesEqual,
} from '../cube';
import type { RandomSource } from '../cube';
import { isFaceletString } from './protocol';
import { initSolver, solveFacelets } from './solve';

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

beforeAll(() => {
  initSolver();
}, 60_000);

describe('Solver contract', () => {
  it('solves a fixed set of random Scrambles through the Cube engine', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const scramble = generateScramble(25, mulberry32(seed));
      const scrambled = applyMoves(createSolvedCube(), scramble);
      const facelets = faceletString(scrambled);

      expect(isFaceletString(facelets)).toBe(true);

      const result = solveFacelets(facelets);
      const solution = result.moves;
      const solved = applyMoves(scrambled, solution);

      expect(isSolved(solved)).toBe(true);
      expect(solution.length).toBeGreaterThan(0);
      expect(solution.length).toBeLessThanOrEqual(30);

      if (solution.length > 1) {
        expect(movesEqual(solution, invertMoves(scramble))).toBe(false);
      }
    }
  });

  it('solves the Solved State back to itself', () => {
    const result = solveFacelets(faceletString(createSolvedCube()));
    expect(isSolved(applyMoves(createSolvedCube(), result.moves))).toBe(true);
  });

  it('accepts only 54 Facelets from the six Face letters', () => {
    expect(isFaceletString(faceletString(createSolvedCube()))).toBe(true);
    expect(isFaceletString('U'.repeat(53))).toBe(false);
    expect(isFaceletString(`${'U'.repeat(53)}X`)).toBe(false);
    expect(isFaceletString('')).toBe(false);
  });

  it('rejects a malformed Facelet string at the Solver boundary', () => {
    expect(isFaceletString('not-a-cube')).toBe(false);
    expect(isFaceletString('U'.repeat(54))).toBe(true);
    expect(() => solveFacelets('not-a-cube')).toThrow(/54 characters/);
  });
});
