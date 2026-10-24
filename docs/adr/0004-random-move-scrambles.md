# 0004 — Random-move Scrambles, not WCA random-state Scrambles

TwistSolve generates a 25-Move Scramble with crypto-random face choices, excluding immediate face repeats and redundant same-axis sandwiches.

A WCA random-state Scramble requires unbiased sampling of the 43 quintillion Cube States and a solver-backed scramble generator. That is a different product problem and would slow the interaction. The Scramble's job here is to produce a genuinely mixed Cube State for the Solver to attack, not to be competition-legal.

**Consequences:** Scrambles are not WCA-legal; Solution length is a property of the Solver and current state, not a competition metric.
