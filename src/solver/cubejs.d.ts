declare module 'cubejs' {
  export default class Cube {
    constructor();
    static initSolver(): void;
    static fromString(facelets: string): Cube;
    move(sequence: string): void;
    asString(): string;
    isSolved(): boolean;
    solve(maxDepth?: number): string;
  }
}
