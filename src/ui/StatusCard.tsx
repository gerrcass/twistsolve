import type { Move } from '../cube';
import type { ActiveMove, RunPhase, SolveReceipt } from '../app/runner';
import type { SolverStatus } from '../solver/protocol';
import { CheckIcon } from './icons';

interface StatusCardProps {
  phase: RunPhase;
  error: string | null;
  active: ActiveMove | null;
  scramble: Move[];
  solution: Move[];
  receipt: SolveReceipt | null;
  solverStatus: SolverStatus;
}

function formatMs(ms: number): string {
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function copyFor(
  phase: RunPhase,
  solverStatus: SolverStatus,
  active: ActiveMove | null,
  solution: Move[],
  scramble: Move[],
): { label: string; detail: string } {
  switch (phase) {
    case 'idle':
      return {
        label: 'Solved',
        detail: 'The cube is in the Solved State. Scramble it to begin.',
      };
    case 'scrambling':
      return {
        label: 'Scrambling',
        detail: `Applying ${scramble.length} random Moves, one turn at a time.`,
      };
    case 'scrambled':
      return {
        label: 'Scrambled',
        detail: `${scramble.length} Moves in. Ask the Solver for a way back.`,
      };
    case 'turning':
      return {
        label: 'Turning',
        detail: 'Manual Move in progress.',
      };
    case 'solving':
      return {
        label: solverStatus === 'warming' ? 'Warming Solver' : 'Searching',
        detail:
          solverStatus === 'warming'
            ? 'Building the Kociemba tables in the Solver Worker.'
            : 'Kociemba two-phase search on the current Cube State.',
      };
    case 'playing':
      return {
        label: 'Solving',
        detail: `Move ${(active?.index ?? 0) + 1} of ${solution.length} — computed from this state, not the Scramble.`,
      };
    case 'solved':
      return {
        label: 'Solved',
        detail: `The Solver found a ${solution.length}-Move Solution from this Cube State.`,
      };
    case 'custom':
      return {
        label: 'Custom state',
        detail: 'A Cube State you built by hand. The Solver can take it from here.',
      };
    case 'error':
      return {
        label: 'Solver error',
        detail: 'The Cube State is untouched. Try the Solver again.',
      };
  }
}

export function StatusCard({
  phase,
  error,
  active,
  scramble,
  solution,
  receipt,
  solverStatus,
}: StatusCardProps) {
  const copy = copyFor(phase, solverStatus, active, solution, scramble);
  const hasScramble = scramble.length > 0;

  return (
    <section
      className="status-card"
      data-phase={phase}
      data-testid="status-card"
      aria-live="polite"
    >
      <div className="status-card__head">
        <span className="status-card__dot" aria-hidden />
        <div>
          <p className="status-card__label" data-testid="status-label">
            {copy.label}
          </p>
          <p className="status-card__detail" data-testid="status-detail">
            {phase === 'error' && error ? error : copy.detail}
          </p>
        </div>
      </div>

      {phase === 'solving' && (
        <div className="search-progress" aria-hidden>
          <span />
        </div>
      )}

      {receipt && (
        <div className="receipt" data-testid="solve-receipt">
          <div className="receipt__line">
            <span>
              <strong>{receipt.moveCount}</strong> moves
            </span>
            <span className="receipt__sep" aria-hidden>
              ·
            </span>
            <span>
              <strong>{formatMs(receipt.computeMs)}</strong> search
            </span>
            <span className="receipt__sep" aria-hidden>
              ·
            </span>
            <span>Kociemba two-phase</span>
          </div>

          <p className="receipt__note" data-testid="solution-not-inverse">
            <CheckIcon />
            {hasScramble
              ? 'Computed from this Cube State — not the inverse Scramble.'
              : 'Computed from the current Cube State — not a rewind.'}
          </p>
        </div>
      )}
    </section>
  );
}
