import { useEffect } from 'react';
import { FACES } from './cube';
import type { Face } from './cube';
import { useCubeRunner } from './app/useCubeRunner';
import { useReducedMotion } from './app/useReducedMotion';
import { useSolver } from './app/useSolver';
import { CubeCanvas } from './scene/CubeCanvas';
import { ActionButton } from './ui/ActionButton';
import { BrandMark } from './ui/BrandMark';
import { ManualPad } from './ui/ManualPad';
import { SequenceList } from './ui/SequenceList';
import { SolverBadge } from './ui/SolverBadge';
import { StageOverlay } from './ui/StageOverlay';
import { StatusCard } from './ui/StatusCard';
import {
  ArrowUpRightIcon,
  GithubIcon,
  ResetIcon,
  ShuffleIcon,
  SparkIcon,
} from './ui/icons';

const REPO_URL = 'https://github.com/gerrcass/twistsolve';

function isFace(value: string): value is Face {
  return (FACES as readonly string[]).includes(value);
}

export function App() {
  const solver = useSolver();
  const reducedMotion = useReducedMotion();
  const runner = useCubeRunner({ solve: solver.solve });
  const { state, scramble, solve, reset, manualTurn } = runner;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, button, a, [contenteditable="true"]',
        )
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void solve();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        reset();
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        scramble();
        return;
      }

      const face = event.key.toUpperCase();
      if (isFace(face)) {
        event.preventDefault();
        manualTurn(face, event.shiftKey ? 3 : 1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [manualTurn, reset, scramble, solve]);

  const recommended = runner.canSolve
    ? 'solve'
    : runner.canScramble
      ? 'scramble'
      : null;

  const scrambleActive =
    state.active?.source === 'scramble' ? state.active.index : -1;
  const solutionActive =
    state.active?.source === 'solution' ? state.active.index : -1;

  const solveDisabled =
    !runner.canSolve || solver.status === 'error';
  const solveLabel =
    state.phase === 'solving'
      ? 'Searching'
      : state.phase === 'error'
        ? 'Try again'
        : 'Solve cube';

  return (
    <div className="app" data-phase={state.phase}>
      <div className="ambient" aria-hidden />

      <header className="masthead">
        <a className="brand" href="./" aria-label="TwistSolve home">
          <BrandMark />
          <span className="brand__text">
            <span className="brand__name">TwistSolve</span>
            <span className="brand__sub">3×3×3 solver lab</span>
          </span>
        </a>

        <div className="masthead__right">
          <SolverBadge status={solver.status} initMs={solver.initMs} />
          <span className="masthead__rule" aria-hidden />
          <a
            className="github-link"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <GithubIcon />
            <span>Source</span>
            <ArrowUpRightIcon />
          </a>
        </div>
      </header>

      <main className="workspace">
        <section
          className="stage"
          data-testid="cube-stage"
          aria-label="Interactive 3D Rubik's Cube"
        >
          <p className="sr-only">
            Interactive 3D Rubik's Cube. Scramble it, solve it with the
            Kociemba Solver, or turn faces by hand.
          </p>
          <CubeCanvas cube={state.cube} animation={state.animation} />
          <StageOverlay
            phase={state.phase}
            solverStatus={solver.status}
            solutionCount={state.solution.length}
            scrambleCount={state.scramble.length}
            speed={state.speed}
            onSpeedChange={runner.setSpeed}
            reducedMotion={reducedMotion}
          />
        </section>

        <aside className="console" aria-label="Cube controls">
          <div className="console__scroll">
            <section className="hero">
              <p className="eyebrow">
                <span className="eyebrow__rule" aria-hidden />
                Rubik's Cube · 3×3×3
              </p>
              <h1>
                A real solve,
                <br />
                <span className="hero__accent">not a rewind.</span>
              </h1>
              <p className="lede">
                Scramble the cube. Watch a Kociemba solver search the state in
                front of you and play back a solution it just found — never the
                reverse.
              </p>
            </section>

            <section className="actions" aria-label="Cube actions">
              <ActionButton
                variant={recommended === 'scramble' ? 'primary' : 'secondary'}
                icon={<ShuffleIcon />}
                onClick={scramble}
                disabled={!runner.canScramble}
                shortcut="S"
                testId="scramble-button"
              >
                {state.phase === 'scrambling' ? 'Scrambling' : 'Scramble'}
              </ActionButton>

              <ActionButton
                variant={recommended === 'solve' ? 'primary' : 'secondary'}
                icon={<SparkIcon />}
                onClick={() => void solve()}
                disabled={solveDisabled}
                busy={state.phase === 'solving'}
                shortcut="↵"
                testId="solve-button"
                title={
                  solver.status === 'error'
                    ? 'The Solver Worker is offline.'
                    : undefined
                }
              >
                {solveLabel}
              </ActionButton>

              <ActionButton
                variant="ghost"
                icon={<ResetIcon />}
                onClick={reset}
                disabled={!runner.canReset}
                testId="reset-button"
              >
                Reset
              </ActionButton>
            </section>

            <StatusCard
              phase={state.phase}
              error={state.error}
              active={state.active}
              scramble={state.scramble}
              solution={state.solution}
              receipt={state.receipt}
              solverStatus={solver.status}
            />

            <div className="sequences">
              <SequenceList
                title="Scramble"
                moves={state.scramble}
                activeIndex={scrambleActive}
                empty="No Scramble yet. Start with the button above."
                testId="scramble-sequence"
              />
              <SequenceList
                title="Solution"
                moves={state.solution}
                activeIndex={solutionActive}
                empty="The Solver's fresh Solution will appear here."
                testId="solution-sequence"
              />
            </div>

            <div className="controls">
              <ManualPad
                disabled={!runner.canManualTurn}
                modifier={state.modifier}
                onModifierChange={runner.setModifier}
                onTurn={(face) => manualTurn(face)}
              />
            </div>

          </div>
        </aside>
      </main>
    </div>
  );
}
