import type { SolverStatus } from '../solver/protocol';

const LABELS: Record<SolverStatus, string> = {
  warming: 'Warming Solver',
  ready: 'Solver ready',
  error: 'Solver offline',
};

export function SolverBadge({
  status,
  initMs,
}: {
  status: SolverStatus;
  initMs: number | null;
}) {
  return (
    <div
      className="solver-badge"
      data-status={status}
      data-testid="solver-badge"
      title={
        initMs !== null
          ? `Kociemba tables ready in ${Math.round(initMs)} ms`
          : 'Kociemba two-phase Solver'
      }
    >
      <span className="solver-badge__dot" />
      <span>{LABELS[status]}</span>
    </div>
  );
}
