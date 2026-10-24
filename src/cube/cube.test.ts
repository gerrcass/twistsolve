import { describe, expect, it } from 'vitest';
import {
  ALL_MOVES,
  applyMove,
  applyMoves,
  createSolvedCube,
  faceletString,
  FACE_OPPOSITE,
  formatMoves,
  generateScramble,
  invertMoves,
  isAtHome,
  isSolved,
  parseMove,
  parseMoves,
  SOLVED_FACELETS,
} from './index';
import type { Move, RandomSource } from './index';

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

describe('Facelet serialization', () => {
  it('serializes the Solved State', () => {
    expect(faceletString(createSolvedCube())).toBe(SOLVED_FACELETS);
  });

  it.each<[string, string]>([
    ['U', 'UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB'],
    ['R', 'UUFUUFUUFRRRRRRRRRFFDFFDFFDDDBDDBDDBLLLLLLLLLUBBUBBUBB'],
    ['F', 'UUUUUULLLURRURRURRFFFFFFFFFRRRDDDDDDLLDLLDLLDBBBBBBBBB'],
    ['D', 'UUUUUUUUURRRRRRFFFFFFFFFLLLDDDDDDDDDLLLLLLBBBBBBBBBRRR'],
    ['L', 'BUUBUUBUURRRRRRRRRUFFUFFUFFFDDFDDFDDLLLLLLLLLBBDBBDBBD'],
    ['B', 'RRRUUUUUURRDRRDRRDFFFFFFFFFDDDDDDLLLULLULLULLBBBBBBBBB'],
    ["R U R' U'", 'UULUUFUUFRRUBRRURRFFDFFUFFFDDRDDDDDDBLLLLLLLLBRRBBBBBB'],
    [
      "F R U R' U' F'",
      'UULUUFUBLUUURRRRRRRUFFFFFFFDDDDDDDDDBLFLLLLLLBRRBBBBBB',
    ],
  ])('matches the reference for %s', (sequence, expected) => {
    const state = applyMoves(createSolvedCube(), parseMoves(sequence));
    expect(faceletString(state)).toBe(expected);
  });

  it('serializes every color exactly nine times after a Scramble', () => {
    const state = applyMoves(
      createSolvedCube(),
      generateScramble(25, mulberry32(7)),
    );
    const facelets = faceletString(state);

    for (const color of ['U', 'R', 'F', 'D', 'L', 'B']) {
      expect([...facelets].filter((cell) => cell === color)).toHaveLength(9);
    }
  });
});

describe('Move algebra', () => {
  it.each(ALL_MOVES)('$face$amount applied four times is identity', (move) => {
    let state = createSolvedCube();
    for (let index = 0; index < 4; index += 1) {
      state = applyMove(state, move);
    }
    expect(isSolved(state)).toBe(true);
    expect(isAtHome(state)).toBe(true);
  });

  it.each(ALL_MOVES)('$face$amount is inverted by its prime', (move) => {
    const prime = parseMove(
      `${move.face}${move.amount === 2 ? '2' : move.amount === 1 ? "'" : ''}`,
    );
    const state = applyMoves(createSolvedCube(), [move, prime]);
    expect(isSolved(state)).toBe(true);
  });

  it('treats a 180° Move as two quarter turns', () => {
    const quarter = applyMoves(createSolvedCube(), parseMoves('R R'));
    const half = applyMoves(createSolvedCube(), parseMoves('R2'));
    expect(faceletString(quarter)).toBe(faceletString(half));
  });

  it('round-trips a sequence through its inverse', () => {
    const sequence = parseMoves("R U2 F' L D B2 R' U F2 D' L2");
    const state = applyMoves(createSolvedCube(), sequence);
    expect(isSolved(state)).toBe(false);

    const restored = applyMoves(state, invertMoves(sequence));
    expect(isSolved(restored)).toBe(true);
  });

  it('does not mutate the input Cube State', () => {
    const solved = createSolvedCube();
    const before = faceletString(solved);
    applyMove(solved, parseMove('R'));
    expect(faceletString(solved)).toBe(before);
  });

  it('rejects malformed Moves', () => {
    expect(() => parseMove('X')).toThrow(/Invalid Move/);
    expect(() => parseMove('R3')).toThrow(/Invalid Move/);
    expect(() => parseMove('')).toThrow(/Invalid Move/);
  });
});

describe('Scramble generation', () => {
  it('produces 25 legal Moves', () => {
    const scramble = generateScramble(25, mulberry32(42));
    expect(scramble).toHaveLength(25);
    expect(() => parseMoves(formatMoves(scramble))).not.toThrow();
  });

  it('never repeats a face or forms a same-axis sandwich', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const scramble = generateScramble(100, mulberry32(seed));
      for (let index = 0; index < scramble.length; index += 1) {
        const move = scramble[index];
        const previous = scramble[index - 1];
        const beforePrevious = scramble[index - 2];

        if (previous) {
          expect(move.face).not.toBe(previous.face);
        }
        if (beforePrevious && previous) {
          const sandwich =
            move.face === beforePrevious.face &&
            previous.face === FACE_OPPOSITE[move.face];
          expect(sandwich).toBe(false);
        }
      }
    }
  });

  it('is overwhelmingly likely to differ across Scrambles', () => {
    const first = formatMoves(generateScramble(25, mulberry32(1)));
    const second = formatMoves(generateScramble(25, mulberry32(2)));
    expect(first).not.toBe(second);
  });

  it('rejects invalid lengths', () => {
    expect(() => generateScramble(0)).toThrow(/positive integer/);
    expect(() => generateScramble(2.5)).toThrow(/positive integer/);
  });
});

describe('Move formatting', () => {
  it.each<[string, Move]>([
    ['R', { face: 'R', amount: 1 }],
    ["R'", { face: 'R', amount: 3 }],
    ['R2', { face: 'R', amount: 2 }],
  ])('parses and formats %s', (text, move) => {
    expect(parseMove(text)).toEqual(move);
    expect(formatMoves([move])).toBe(text);
  });

  it('tolerates lowercase and typographic apostrophes', () => {
    expect(parseMove("r’")).toEqual({ face: 'R', amount: 3 });
  });
});
