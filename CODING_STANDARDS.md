# Coding standards

Review-time rules. Implementation agents follow the architecture; reviewers enforce this file.

## TypeScript

- `strict` is on. No `any` in application code; use `unknown` at boundaries and narrow.
- Domain types use glossary names (`CubeState`, `Cubie`, `Move`, `Solution`, `Facelet`).
- Parse external solver output into typed Moves; keep raw strings at the boundary.
- Exhaustive switches on unions. No non-null assertions where a guard reads clearly.

## Cube engine

- Pure and framework-free: no React, Three.js, DOM, or worker imports in `src/cube`.
- Moves are exact quarter/half turns; never interpolate the committed Cube State.
- Facelet serialization is canonical and covered by a solved-state test and a round-trip test.
- Scramble generation excludes immediate face repeats and redundant same-axis sandwiches.

## Solver boundary

- `cubejs` is imported only inside the Solver Worker module graph (`src/solver/solve.ts`, imported by the worker). The main bundle must not include it; tests may exercise the adapter.
- The worker validates the Facelet string and verifies its Solution before answering.
- The main thread never blocks on table initialization; progress and errors are visible states.
- A failed or timed-out Solve leaves the Cube State untouched and offers retry.

## React and scene

- One owner for run state: the app reducer. Components derive; they do not mirror.
- The scene never mutates the Cube State; the Move Scheduler reports Move completion.
- Disposal of Three.js resources is handled by react-three-fiber primitives; no manual leaks.
- Respect Reduced Motion for camera and Turn Animation.
- Buttons are real buttons with accessible names; keyboard shortcuts never fire while typing in a field.

## Visual

- Follow the design tokens (color, type, spacing) rather than one-off values.
- Sticker colors stay distinguishable: white, yellow, red, orange, green, blue, with contrast against the graphite Cubie body.
- The Solve Receipt is part of the product, not a debug panel.

## Tests

- Tests assert external behavior at the seams in `docs/architecture.md`. Scheduler tests cover commit-once, cancellation, empty runs, and restart; the browser path covers the real queue.
- No snapshots of WebGL output. Use Playwright for the user path and engine tests for correctness.
- A bug fix adds a regression test at the highest seam that reproduces it.
