# 0001 — Use Kociemba via cubejs in a Web Worker

TwistSolve must solve arbitrary Cube States, not replay a Scramble backwards. We use the Kociemba two-phase Solver from the MIT-licensed `cubejs` package, initialized inside a dedicated Web Worker.

We chose a proven implementation over writing pruning tables ourselves because a subtly wrong solver is expensive to detect and fatal to the product promise. The worker boundary keeps the roughly 1.5 s table initialization and the search off the main thread, and it isolates the dependency behind a narrow message contract so the Solver can be replaced later.

**Consequences:** the app ships a small solver dependency; Solutions are near-optimal (typically 18–22 Moves); the first Solve pays worker initialization cost.
