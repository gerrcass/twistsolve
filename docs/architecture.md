# Architecture

## Shape

```text
app state (React reducer)
├── Cube State ──────────────► scene (Cubie transforms, Turn Animation)
│        │
│        └── Facelets ───────► Solver Worker ──► Solution (Moves)
│                                      │
└── Move Queue ◄───────────────────────┘
```

The **Cube engine** is pure TypeScript and owns the Cube State. The **scene** renders the engine's Cubie transforms. The **Solver Worker** accepts only Facelets and returns a Solution. The **app reducer** owns the Move Queue and the run state; it commits a Move exactly once, when its Turn Animation completes or immediately under Reduced Motion.

## Modules

```text
src/
├── cube/       # Cubie, Cube State, Moves, Scramble, Facelets
├── solver/     # worker client + solver.worker.ts (cubejs adapter)
├── scene/      # Canvas, Cubie meshes, lighting, orbit, Turn Animation
├── ui/         # controls, Move history, Solve Receipt, status
└── app/        # reducer, composition, keyboard bindings, layout
```

## Invariants

1. **Transform is truth.** A Cubie's position and orientation quaternion define the Cube State. Facelets, rendering, and Solved State checks all derive from it. Never keep a second mutable representation in sync.
2. **The Solver never sees the Scramble.** It receives Facelets and returns a freshly searched Solution. The Scramble is display history, not a solve input.
3. **One move at a time.** The Move Queue animates a single Move; the reducer commits it once. Scramble, Solve, Reset, and manual input share that queue.
4. **Worker-only solving.** `cubejs` appears only in `solver.worker.ts`. The main thread imports the worker client, not the Solver.
5. **Every animated path has a Reduced Motion path.** State transitions are identical; only duration changes.
6. **Legal states only.** The engine exposes Moves, never arbitrary sticker mutation, so the Solver should never receive an unsolvable Cube State.

## Seams

- **Engine seam**: `createSolvedState`, `applyMove`, `serializeFacelets`, `parseMoves`, `isSolved`.
- **Solver seam**: a typed `solve(facelets)` client over `postMessage`; responses are `ready`, `solved`, `invalid`, `error`.
- **Browser seam**: the published page, driven by Playwright.

Tests target these seams, not component internals.
