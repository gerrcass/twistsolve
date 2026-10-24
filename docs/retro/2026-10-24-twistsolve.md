# Retro — TwistSolve v1, 2026-10-24

Session retro for the build that produced TwistSolve v1. Findings are ordered by severity and each one is applied in this PR.

## 1. Automated checks: npm 10 cannot resolve Vitest 4's optional peers

`npm install` failed with `Cannot read properties of null (reading 'edgesOut')` in arborist. The fix is a committed `.npmrc` with `legacy-peer-deps=true`, which makes `npm ci` deterministic in CI and on a fresh checkout.

**Applied:** `.npmrc`, plus the CI/deploy workflows install with `npm ci`.

## 2. Automated checks: the Solver boundary was only a convention

Nothing stopped a future import of `cubejs` from leaking into the main bundle, which would add table initialization to the critical path and break the worker-only invariant.

**Applied:** `scripts/verify-bundle.mjs` is part of `npm run check` and both workflows. It fails if `initSolver` appears outside the Solver Worker chunk.

## 3. Coding standards: the review found real drift

The Standards review caught the Cube State documented as a quaternion when the implementation uses exact matrices, the visual standard still saying "ivory" after the design moved to graphite, and the Move Queue described as reducer-owned when timers live in an imperative scheduler.

**Applied:** `docs/architecture.md`, `CODING_STANDARDS.md`, `docs/adr/0002-transformed-cubies.md`, and the spec issue now match the code. The queue was extracted into a tested `MoveScheduler`, and the Solver into a testable adapter.

## 4. Information access: the browser path was the only proof of the real queue

Unit tests covered the reducer, but not the timing, cancellation, and worker path that users actually experience.

**Applied:** Playwright now covers Scramble → Solve, Reduced Motion, manual-state solving, keyboard focus survival, and the 1440×900 console fit. The Move Scheduler has its own commit-once/cancel/empty-run tests.

## 5. Navigation: the agent guide needed one more gotcha

`AGENTS.md` pointed at the architecture and standards, but did not explain the `.npmrc` workaround or the screenshot workflow.

**Applied:** short environment notes in `AGENTS.md`.
