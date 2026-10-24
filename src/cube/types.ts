export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type Axis = 'x' | 'y' | 'z';

/** Quarter turns clockwise, as seen from outside the Face. */
export type Amount = 1 | 2 | 3;

export interface Move {
  face: Face;
  amount: Amount;
}

export type Vec3 = readonly [number, number, number];

/** Row-major 3×3 rotation matrix. */
export type Mat3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface Sticker {
  normal: Vec3;
  color: Face;
}

export interface Cubie {
  id: string;
  home: Vec3;
  position: Vec3;
  rotation: Mat3;
  stickers: readonly Sticker[];
}

export interface CubeState {
  cubies: readonly Cubie[];
}

export interface FaceTurn {
  axis: Axis;
  layer: -1 | 1;
  /** -1 for counterclockwise, +1 for clockwise, as seen from outside. */
  direction: -1 | 1;
}
