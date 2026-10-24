# TwistSolve — agent guide

TwistSolve is a browser-based 3D Rubik's Cube. Scramble a real cube, press Solve, and watch a Kociemba two-phase Solution computed from the current Cube State. Static React app, no backend, deployed to GitHub Pages.

## Orientation

- **Language**: `GLOSSARY.md` defines the domain terms used in code, tests, tickets, and UI copy.
- **Architecture and invariants**: `docs/architecture.md` — read before changing the Cube State, the Solver boundary, or the Move Queue.
- **Decisions**: `docs/adr/` — read the ADR that touches your area before proposing a different shape.
- **Product spec**: GitHub issue #1.
- **Review rules**: `CODING_STANDARDS.md` — the review agent enforces these.
- **Work tracking**: `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`.
- **Why the product is shaped this way**: `docs/grill/2026-10-24-twistsolve.md`.
- **Session retro**: `docs/retro/2026-10-24-twistsolve.md`.

## Agents

Run `npm run check` before handing work off. Scripts live in `package.json`; do not restate them here.

Environment notes:

- `.npmrc` sets `legacy-peer-deps=true` because npm 10's arborist fails on Vitest 4's optional peer graph. Keep it.
- `npm run screenshot` expects a running preview (`npm run preview -- --port 4173`). The committed README image is the optimized WebP; the PNG is a local source.
- `npm run check` includes the bundle boundary check. `cubejs` must stay in the Solver Worker graph.

## Agent skills

### Issue tracker

GitHub Issues in `gerrcass/twistsolve`; specs and tickets are issues with native blocking edges. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five-role vocabulary, labels equal to role names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the root plus `docs/adr/`. See `docs/agents/domain.md`.
