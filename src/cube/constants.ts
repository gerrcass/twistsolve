import type { Axis, Face, FaceTurn, Mat3, Vec3 } from './types';

export const FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export const FACE_NORMALS: Record<Face, Vec3> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

export const FACE_OPPOSITE: Record<Face, Face> = {
  U: 'D',
  D: 'U',
  R: 'L',
  L: 'R',
  F: 'B',
  B: 'F',
};

export const FACE_TURNS: Record<Face, FaceTurn> = {
  U: { axis: 'y', layer: 1, direction: -1 },
  R: { axis: 'x', layer: 1, direction: -1 },
  F: { axis: 'z', layer: 1, direction: -1 },
  D: { axis: 'y', layer: -1, direction: 1 },
  L: { axis: 'x', layer: -1, direction: 1 },
  B: { axis: 'z', layer: -1, direction: 1 },
};

export const FACE_COLORS: Record<Face, string> = {
  U: '#f2eee3',
  D: '#ffd24a',
  F: '#2fbf71',
  B: '#3478f6',
  R: '#e8483f',
  L: '#ff8a3d',
};

export const FACE_OFFSETS: Record<Face, number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};

export const SOLVED_FACELETS =
  'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

export const IDENTITY_MATRIX: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

export const AXIS_VECTOR: Record<Axis, Vec3> = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};
