# 0002 — Transformed Cubies are the single source of truth

The Cube State is modeled as 26 Cubies, each holding a position and an exact 3×3 orientation matrix. A Move selects the Cubies in one layer, rotates their positions and orientations by an exact quarter turn, and commits the result.

Rendering reads those transforms directly, while the Facelet string for the Solver is derived from the same transforms. This avoids keeping a permutation model and a rendering model in sync, and it makes the engine's contract testable in both directions: solved state produces the canonical Facelet string, and applying a Solution returns to it.

**Consequences:** orientation math is exact integer quarter turns (no drift); the Solver only ever sees Facelets, never Tile transforms; per-Cubie animation is a render-time interpolation of the same transform.
