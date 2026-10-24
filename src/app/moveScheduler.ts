import type { TurnAnimationState } from '../animation';
import type { Move } from '../cube';
import type { ActiveMove, MoveSource } from './runner';

export interface SchedulerItem {
  move: Move;
  source: MoveSource;
  index: number;
}

export interface MoveSchedulerCallbacks {
  onStart: (animation: TurnAnimationState, active: ActiveMove) => void;
  onCommit: (move: Move, source: MoveSource) => void;
  onFinish: (source: MoveSource) => void;
}

export interface MoveSchedulerOptions {
  durationFor: (item: SchedulerItem) => number;
  gapMs?: number;
  now?: () => number;
  setTimer?: (callback: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
}

/**
 * Owns the imperative side of the Move Queue: timers, tokens, and cancellation.
 * Visible run state stays in the reducer; this class only reports starts,
 * commits, and completion.
 */
export class MoveScheduler {
  private queue: SchedulerItem[] = [];
  private timer: number | null = null;
  private token = 0;
  private active = false;

  private readonly callbacks: MoveSchedulerCallbacks;
  private readonly durationFor: (item: SchedulerItem) => number;
  private readonly gapMs: number;
  private readonly now: () => number;
  private readonly setTimer: (callback: () => void, ms: number) => number;
  private readonly clearTimer: (id: number) => void;

  constructor(
    callbacks: MoveSchedulerCallbacks,
    options: MoveSchedulerOptions,
  ) {
    this.callbacks = callbacks;
    this.durationFor = options.durationFor;
    this.gapMs = options.gapMs ?? 42;
    this.now = options.now ?? (() => performance.now());
    this.setTimer =
      options.setTimer ??
      ((callback, ms) => window.setTimeout(callback, ms));
    this.clearTimer =
      options.clearTimer ?? ((id) => window.clearTimeout(id));
  }

  get isBusy(): boolean {
    return this.active;
  }

  start(moves: readonly Move[], source: MoveSource): boolean {
    if (this.active) return false;

    if (moves.length === 0) {
      this.callbacks.onFinish(source);
      return true;
    }

    this.active = true;
    this.queue = moves.map((move, index) => ({ move, source, index }));
    this.step();
    return true;
  }

  cancel(): void {
    this.token += 1;
    if (this.timer !== null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
    this.queue = [];
    this.active = false;
  }

  private step = (): void => {
    const item = this.queue.shift();
    if (!item) {
      this.active = false;
      return;
    }

    const token = this.token + 1;
    this.token = token;
    const duration = this.durationFor(item);

    this.callbacks.onStart(
      {
        move: item.move,
        startedAt: this.now(),
        duration,
      },
      { source: item.source, index: item.index },
    );

    this.timer = this.setTimer(() => this.commit(item, token), duration);
  };

  private commit(item: SchedulerItem, token: number): void {
    if (token !== this.token) return;

    this.timer = null;
    this.callbacks.onCommit(item.move, item.source);

    if (this.queue.length === 0) {
      this.active = false;
      this.callbacks.onFinish(item.source);
      return;
    }

    this.timer = this.setTimer(this.step, this.gapMs);
  }
}
