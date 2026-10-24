# Architecture

## Shape

```text
app state (React reducer)
├── Cube State ──────────────► scene (Cubie transforms, Turn Animation)
│        │
│        └── Facelets ───────► Solver Worker ──► Solution (Moves)
│                                      │
└── Move Scheduler ────────────────────┘
```

The **Cube engine** is pure TypeScript and owns the Cube State. The **scene** renders the engine's Cubie transforms. The **Solver Worker** accepts only Facelets and returns a Solution. The **app reducer** owns the visible run state. The **Move Scheduler** owns the imperative queue, timers, and cancellation; it reports starts, commits, and completion to the reducer. A Move is committed once at the end of its animation timeline, or immediately under Reduced Motion.

## Modules

```text
src/
├── cube/       # Cubie, Cube State, Moves, Scramble, Facelets
├── solver/     # typed worker client, solver.worker.ts, solve.ts (cubejs adapter)
├── scene/      # Canvas, Cubie meshes, lighting, orbit, Turn Animation
├── ui/         # controls, Move history, Solve Receipt, status
└── app/        # reducer, Move Scheduler, solver hook, keyboard, layout
```

## Invariants

1. **Transform is truth.** A Cubie's position and orientation matrix define the Cube State. Facelets, rendering, and Solved State checks all derive from it. Never keep a second mutable representation in sync.
2. **The Solver never sees the Scramble.** It receives Facelets and returns a freshly searched Solution. The Scramble is display history, not a solve input.
3. **One move at a time.** The Move Scheduler animates a single Move and reports one commit. Scramble, Solve, Reset, and manual input share that queue.
4. **Worker-only solving.** `cubejs` appears only inside the Solver Worker module graph (`src/solver/solve.ts`, imported by the worker). The main bundle must not contain it.
5. **Every animated path has a Reduced Motion path.** State transitions are identical; only duration changes. The scene removes ambient particles and orbit damping under Reduced Motion.
6. **Legal states only.** The engine exposes Moves, never arbitrary sticker mutation, so the Solver should never receive an unsolvable Cube State.

## Seams

- **Engine seam**: `createSolvedCube`, `applyMove`, `faceletString`, `parseMoves`, `isSolved`.
- **Scheduler seam**: `MoveScheduler.start`, `cancel`, `isBusy`, and its start/commit/finish callbacks.
- **Solver seam**: the pure `solveFacelets` adapter plus a typed `solve(facelets)` client over `postMessage`; responses are `ready`, `init-error`, `solved`, `invalid`, and `error`.
- **Browser seam**: the published page, driven by Playwright.

Tests target these seams, not component internals.
