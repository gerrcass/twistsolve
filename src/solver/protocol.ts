import type { Move } from '../cube';

export type SolverStatus = 'warming' | 'ready' | 'error';

export interface SolveRequest {
  type: 'solve';
  id: number;
  facelets: string;
}

export interface ReadyMessage {
  type: 'ready';
  initMs: number;
}

export interface SolvedMessage {
  type: 'solved';
  id: number;
  notation: string;
  moves: readonly Move[];
  computeMs: number;
  initMs: number;
}

export interface InvalidMessage {
  type: 'invalid';
  id: number;
  reason: string;
}

export interface ErrorMessage {
  type: 'error';
  id: number;
  reason: string;
}

export type WorkerMessage =
  | ReadyMessage
  | SolvedMessage
  | InvalidMessage
  | ErrorMessage;

export interface SolverResult {
  moves: Move[];
  notation: string;
  computeMs: number;
  initMs: number;
}

export function isFaceletString(value: string): boolean {
  return /^[URFDLB]{54}$/.test(value);
}
