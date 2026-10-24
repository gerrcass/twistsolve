import type { Move } from './cube';

export interface TurnAnimationState {
  move: Move;
  startedAt: number;
  duration: number;
}
