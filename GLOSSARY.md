# TwistSolve

A browser-based 3×3 Rubik's Cube simulator. The cube is rendered in 3D, scrambled with real turns, and solved by a Kociemba two-phase solver that computes a fresh Solution from the current Cube State.

## Language

**Cubie**:
One of the 26 visible sub-cubes that make up the Cube. Each Cubie carries zero to three Stickers.
_Avoid_: Block, piece, voxel

**Sticker**:
A single colored face of a Cubie.
_Avoid_: Tile, patch

**Face**:
One of the six sides of the Cube, named `U`, `R`, `F`, `D`, `L`, `B` as viewed with that Face toward the viewer.
_Avoid_: Side, plane

**Facelet**:
One of the 54 Sticker positions on the assembled Cube, addressed by Face and grid position. The Solver's input format.
_Avoid_: Square, tile

**Move**:
A quarter or half turn of one Face, written in Singmaster notation: `R`, `R'`, `R2`.
_Avoid_: Turn (as a noun for the notation), rotation

**Cube State**:
The arrangement and orientation of all Cubies. Serialized for the Solver as 54 Facelets.
_Avoid_: Position, layout

**Solved State**:
The Cube State in which every Face shows one color.

**Scramble**:
A recorded random Move sequence used to produce a scrambled Cube State. A Scramble is never used as the solve path.
_Avoid_: Shuffle, mix

**Solution**:
A Move sequence computed from the current Cube State by the Solver, ending in the Solved State.
_Avoid_: Algorithm, answer, solve path

**Solver**:
The Kociemba two-phase implementation that computes a Solution.
_Avoid_: Engine (reserved for the Cube engine), AI

**Solver Worker**:
The Web Worker boundary that hosts the Solver so table generation and search never block the interface.
_Avoid_: Backend, server

**Move Queue**:
The ordered Moves waiting to be animated. Exactly one Turn Animation runs at a time.
_Avoid_: Animation list, buffer

**Turn Animation**:
The 90° or 180° rotation of the Cubies in one layer that visualizes a Move.
_Avoid_: Spin, tween

**Solve Receipt**:
The post-solve readout showing Solution length, Solver compute time, and that the Solution was computed from the current Cube State.
_Avoid_: Stats, result card

**Reduced Motion**:
The operating-system preference that replaces Turn Animations with immediate state changes.
_Avoid_: Fast mode, no-animation
