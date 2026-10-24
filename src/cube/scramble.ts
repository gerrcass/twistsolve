import { FACE_OPPOSITE, FACES } from './constants';
import type { Amount, Face, Move } from './types';

export type RandomSource = () => number;

const secureRandom: RandomSource = () => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0x1_0000_0000;
};

function pick<T>(items: readonly T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)];
}

export function isRedundant(
  face: Face,
  previous: Move | undefined,
  beforePrevious: Move | undefined,
): boolean {
  if (!previous) return false;
  if (face === previous.face) return true;
  if (
    beforePrevious &&
    face === beforePrevious.face &&
    previous.face === FACE_OPPOSITE[face]
  ) {
    return true;
  }
  return false;
}

export function generateScramble(
  length = 25,
  random: RandomSource = secureRandom,
): Move[] {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('Scramble length must be a positive integer');
  }

  const moves: Move[] = [];

  while (moves.length < length) {
    const previous = moves[moves.length - 1];
    const beforePrevious = moves[moves.length - 2];
    const candidates = FACES.filter(
      (face) => !isRedundant(face, previous, beforePrevious),
    );
    const face = pick(candidates, random);
    const amount = pick([1, 2, 3] as const, random) as Amount;
    moves.push({ face, amount });
  }

  return moves;
}
