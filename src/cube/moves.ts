import { FACES } from './constants';
import type { Amount, Face, Move } from './types';

const MOVE_PATTERN = /^([URFDLB])([2'])?$/;

export function parseMove(token: string): Move {
  const normalized = token.trim().toUpperCase().replaceAll('’', "'");
  const match = MOVE_PATTERN.exec(normalized);
  if (!match) {
    throw new Error(`Invalid Move: "${token}"`);
  }

  const face = match[1] as Face;
  const suffix = match[2];
  const amount: Amount = suffix === '2' ? 2 : suffix === "'" ? 3 : 1;

  return { face, amount };
}

export function parseMoves(sequence: string): Move[] {
  const trimmed = sequence.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).map(parseMove);
}

export function formatMove(move: Move): string {
  if (move.amount === 2) return `${move.face}2`;
  if (move.amount === 3) return `${move.face}'`;
  return move.face;
}

export function formatMoves(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ');
}

export function invertMove(move: Move): Move {
  const amount: Amount = move.amount === 1 ? 3 : move.amount === 3 ? 1 : 2;
  return { face: move.face, amount };
}

export function invertMoves(moves: readonly Move[]): Move[] {
  return moves.toReversed().map(invertMove);
}

export function moveEquals(a: Move, b: Move): boolean {
  return a.face === b.face && a.amount === b.amount;
}

export function moveId(move: Move): string {
  return `${move.face}${move.amount}`;
}

export function movesEqual(
  a: readonly Move[],
  b: readonly Move[],
): boolean {
  return (
    a.length === b.length && a.every((move, index) => moveEquals(move, b[index]))
  );
}

export const ALL_MOVES: readonly Move[] = FACES.flatMap((face) =>
  ([1, 2, 3] as const).map((amount) => ({ face, amount })),
);
