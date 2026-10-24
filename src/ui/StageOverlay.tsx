import type { RunPhase, Speed } from '../app/runner';
import type { SolverStatus } from '../solver/protocol';
import { CheckIcon } from './icons';
import { StageSpeed } from './StageSpeed';

const PHASE_LABEL: Record<RunPhase, string> = {
  idle: 'Solved',
  scrambling: 'Scrambling',
  scrambled: 'Scrambled',
  turning: 'Turning',
  solving: 'Searching',
  playing: 'Solving',
  solved: 'Solved',
  custom: 'Custom state',
  error: 'Solver error',
};

interface StageOverlayProps {
  phase: RunPhase;
  solverStatus: SolverStatus;
  solutionCount: number;
  scrambleCount: number;
  speed: Speed;
  onSpeedChange: (speed: Speed) => void;
  reducedMotion: boolean;
}

export function StageOverlay({
  phase,
  solverStatus,
  solutionCount,
  scrambleCount,
  speed,
  onSpeedChange,
  reducedMotion,
}: StageOverlayProps) {
  const busy = phase === 'scrambling' || phase === 'solving' || phase === 'playing';

  return (
    <>
      <div className="stage__top">
        <span className="stage__tag">
          <span className="stage__tag-dot" data-busy={busy} />
          Live 3D
        </span>
        <span className="stage__brand">3 × 3 × 3</span>
      </div>

      <div className="stage__corners" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="stage__bottom">
        <div className="stage__status" data-testid="stage-status">
          <span className="stage__status-dot" data-phase={phase} />
          {PHASE_LABEL[phase]}
          {phase === 'scrambled' && (
            <span className="stage__status-meta">{scrambleCount} moves</span>
          )}
          {phase === 'solved' && solutionCount > 0 && (
            <span className="stage__status-meta">{solutionCount} moves</span>
          )}
        </div>

      </div>

      <div className="stage__hint">Drag to orbit · scroll to zoom</div>

      <StageSpeed
        speed={speed}
        onChange={onSpeedChange}
        reducedMotion={reducedMotion}
      />

      <div className="stage__solver" data-status={solverStatus}>
        <span>Kociemba</span>
        <small>two-phase</small>
      </div>

      <div
        className="result-stamp"
        data-visible={phase === 'solved' && solutionCount > 0}
        data-testid="result-stamp"
        aria-hidden={phase !== 'solved'}
      >
        <span className="result-stamp__icon">
          <CheckIcon />
        </span>
        <span>
          <strong>Solved</strong>
          <small>{solutionCount} moves from the scrambled state</small>
        </span>
      </div>
    </>
  );
}
