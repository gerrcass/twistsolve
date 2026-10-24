import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Move } from '../cube';
import { MoveScheduler } from './moveScheduler';
import type { MoveSource } from './runner';

const R: Move = { face: 'R', amount: 1 };
const U: Move = { face: 'U', amount: 2 };
const F: Move = { face: 'F', amount: 3 };

interface Recorded {
  starts: { face: string; index: number }[];
  commits: { face: string; source: MoveSource }[];
  finishes: MoveSource[];
}

function createScheduler(
  options: { duration?: number; gap?: number } = {},
): { scheduler: MoveScheduler; recorded: Recorded } {
  const recorded: Recorded = { starts: [], commits: [], finishes: [] };

  const scheduler = new MoveScheduler(
    {
      onStart: (animation, active) => {
        recorded.starts.push({
          face: animation.move.face,
          index: active.index,
        });
      },
      onCommit: (move, source) => {
        recorded.commits.push({ face: move.face, source });
      },
      onFinish: (source) => {
        recorded.finishes.push(source);
      },
    },
    {
      durationFor: () => options.duration ?? 100,
      gapMs: options.gap ?? 10,
      now: () => 0,
      setTimer: (callback, ms) =>
        setTimeout(callback, ms) as unknown as number,
      clearTimer: (id) => clearTimeout(id),
    },
  );

  return { scheduler, recorded };
}

describe('MoveScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('commits each Move once, in order, and finishes once', () => {
    const { scheduler, recorded } = createScheduler();

    expect(scheduler.start([R, U, F], 'scramble')).toBe(true);
    expect(scheduler.isBusy).toBe(true);
    expect(recorded.starts).toEqual([{ face: 'R', index: 0 }]);

    vi.advanceTimersByTime(100);
    expect(recorded.commits).toEqual([{ face: 'R', source: 'scramble' }]);

    vi.advanceTimersByTime(10);
    expect(recorded.starts).toEqual([
      { face: 'R', index: 0 },
      { face: 'U', index: 1 },
    ]);

    vi.advanceTimersByTime(100);
    expect(recorded.commits).toEqual([
      { face: 'R', source: 'scramble' },
      { face: 'U', source: 'scramble' },
    ]);

    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(100);

    expect(recorded.commits).toEqual([
      { face: 'R', source: 'scramble' },
      { face: 'U', source: 'scramble' },
      { face: 'F', source: 'scramble' },
    ]);
    expect(recorded.finishes).toEqual(['scramble']);
    expect(scheduler.isBusy).toBe(false);
  });

  it('refuses a second run while one is in flight', () => {
    const { scheduler, recorded } = createScheduler();
    scheduler.start([R], 'scramble');

    expect(scheduler.start([U], 'solution')).toBe(false);
    expect(recorded.starts).toHaveLength(1);
  });

  it('cancels the pending timer and commits nothing else', () => {
    const { scheduler, recorded } = createScheduler();
    scheduler.start([R, U, F], 'manual');

    vi.advanceTimersByTime(100);
    expect(recorded.commits).toHaveLength(1);

    scheduler.cancel();
    vi.advanceTimersByTime(10_000);

    expect(recorded.commits).toHaveLength(1);
    expect(recorded.finishes).toHaveLength(0);
    expect(scheduler.isBusy).toBe(false);
  });

  it('can start a new run after cancellation', () => {
    const { scheduler, recorded } = createScheduler();
    scheduler.start([R], 'manual');
    scheduler.cancel();

    expect(scheduler.start([U], 'manual')).toBe(true);
    vi.advanceTimersByTime(100);

    expect(recorded.commits).toEqual([{ face: 'U', source: 'manual' }]);
    expect(recorded.finishes).toEqual(['manual']);
  });

  it('finishes an empty run immediately', () => {
    const { scheduler, recorded } = createScheduler();

    expect(scheduler.start([], 'solution')).toBe(true);
    expect(recorded.finishes).toEqual(['solution']);
    expect(scheduler.isBusy).toBe(false);
  });
});
