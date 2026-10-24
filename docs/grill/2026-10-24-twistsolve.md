# Grill session — TwistSolve, 2026-10-24

Self-driven session. The user asked for the recommended answer at each branch, so every recommendation below was accepted and pushed the frontier outward. No decision is waiting on the user.

## Round 1 — Product

**Q1. What is the core promise?**
Is this a toy to spin, a scramble trainer, or a solver demo?

➡️ **A solver demo you can play with.** The headline is: scramble any state, press Solve, and watch a real Kociemba Solution computed from that state. The 3D cube is the proof, not the product alone.

**Q2. Who is it for?**
Cubers evaluating a solver, developers looking at the architecture, or the general public?

➡️ **Curious cubers and developers.** People who know `R U R' U'` should feel at home; people who do not should still understand what happened. No account, no tutorial mode.

**Q3. What is the primary path?**
Free play, guided solve, or one-click demo?

➡️ **One-click demo, with free play underneath.** Scramble → Solve is the spine. Manual Moves and keyboard control are available but never required.

**Q4. What cube sizes?**
2×2 through 5×5, or 3×3 only?

➡️ **3×3 only.** Every headline promise (Kociemba, 20-ish Move Solutions) is specific to 3×3. Other sizes would be separate products.

**Q5. How transparent is the Solver?**
Hide it, or show its work?

➡️ **Show a Solve Receipt.** Solution length, compute time, and a line stating the Solution was computed from the current Cube State. That receipt is how "true solving" becomes visible rather than a claim.

**Q6. What is explicitly out of scope?**
Accounts, cloud sync, leaderboards, WCA scrambles, 2×2/4×4, tutorials, sound design, mobile apps.

➡️ **All of the above are out.** Ship one sharp browser experience.

## Round 2 — Architecture

**Q7. Do we write the Solver ourselves?**
Kociemba pruning tables from scratch, a simpler layer-by-layer Solver, or a proven implementation?

➡️ **Use the proven MIT-licensed `cubejs` Kociemba implementation.** A subtly wrong hand-rolled Solver is the highest-risk failure in the project and the hardest to notice. Isolate it behind a worker contract so it stays replaceable. Recorded in ADR-0001.

**Q8. Where does the Solver run?**
Main thread, Web Worker, or server?

➡️ **Web Worker.** Table initialization is around 1.5 s and search is CPU-bound. The worker keeps orbit controls and Turn Animations smooth. No server: ADR-0003.

**Q9. What owns the Cube State?**
A permutation model, a facelet model, or transformed Cubies?

➡️ **Transformed Cubies.** Each Cubie owns position and orientation; Moves rotate a layer; Facelets are derived for the Solver. One source of truth for rendering, logic, and serialization. Recorded in ADR-0002.

**Q10. How are Scrambles generated?**
WCA random-state, random Moves, or seeded random Moves?

➡️ **25 random Moves, unseeded, crypto-random.** No immediate face repeats, no redundant same-axis sandwiches. WCA random-state is a different problem. Recorded in ADR-0004.

**Q11. What is the stack?**
Vite + React + TypeScript + Three.js via react-three-fiber. Vitest for the engine and solver contract, Playwright for the user path. GitHub Actions for CI and Pages.

➡️ **Accepted.** Static, client-only, no backend. Recorded in ADR-0003.

**Q12. How is failure handled?**
What if the Solver rejects a Facelet string or takes too long?

➡️ **Fail visibly and recoverably.** The engine only produces legal states, so rejection is a bug signal. Show a short error, keep the Cube State intact, allow retry. A 30 s worker timeout ends in an error, never a frozen UI.

## Round 3 — Experience and quality

**Q13. Visual direction?**
Playful primary colors, minimal white, or a dark workshop?

➡️ **Dark workshop with warm amber light.** Charcoal ground, ivory Cubie bodies, saturated but slightly muted Stickers, monospace Move notation. Editorial, not toy-like.

**Q14. How do Turns animate?**
Instant, springy, or eased quarter turns?

➡️ **Eased 90° turns, one at a time, with a speed control.** 180° turns take one longer turn. Reduced Motion collapses everything to instant state changes.

**Q15. What are the testing seams?**
Where do we test?

➡️ **Three seams, highest first:** (1) the engine's Facelet contract and Move algebra, (2) the Solver Worker contract against real Scrambles, (3) one end-to-end browser path: Scramble → Solve → Solved. Prefer these over component internals.

**Q16. What does done look like?**

➡️ **Live on GitHub Pages**, README with screenshot and demo link, CI green, no open issues or PRs, and the Solve Receipt proving a Solution different from the Scramble inverse.

## Frontier

Empty. Every branch above is resolved and written into `GLOSSARY.md`, `docs/adr/0001`–`0004`, and the published spec.
