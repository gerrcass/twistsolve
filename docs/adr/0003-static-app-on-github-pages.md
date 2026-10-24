# 0003 — Static React app on GitHub Pages

TwistSolve is a client-only Vite + React + TypeScript application rendered with Three.js through react-three-fiber. It is deployed as static assets to GitHub Pages by a GitHub Actions workflow.

There is no backend: the Solver runs on the visitor's device, there is nothing to authenticate, and the whole experience can be linked to and revisited without infrastructure. Vite's relative base keeps the build valid under the `/twistsolve/` repository subpath.

**Consequences:** first load includes the Three.js bundle and the solver chunk; performance depends on the visitor's device; no server-side history, accounts, or telemetry.
