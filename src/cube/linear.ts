import { AXIS_INDEX, FACE_NORMALS, FACES, IDENTITY_MATRIX } from './constants';
import type { Axis, Face, Mat3, Vec3 } from './types';

const POSITIVE_QUARTER_TURNS: Record<Axis, Mat3> = {
  x: [1, 0, 0, 0, 0, -1, 0, 1, 0],
  y: [0, 0, 1, 0, 1, 0, -1, 0, 0],
  z: [0, -1, 0, 1, 0, 0, 0, 0, 1],
};

export function multiplyMatrices(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      out[row * 3 + col] =
        a[row * 3] * b[col] +
        a[row * 3 + 1] * b[3 + col] +
        a[row * 3 + 2] * b[6 + col];
    }
  }
  return out as unknown as Mat3;
}

export function multiplyMatrixVector(matrix: Mat3, vector: Vec3): Vec3 {
  const [x, y, z] = vector;
  return [
    matrix[0] * x + matrix[1] * y + matrix[2] * z,
    matrix[3] * x + matrix[4] * y + matrix[5] * z,
    matrix[6] * x + matrix[7] * y + matrix[8] * z,
  ];
}

export function roundVec3(vector: Vec3): Vec3 {
  return [
    Math.round(vector[0]),
    Math.round(vector[1]),
    Math.round(vector[2]),
  ];
}

export function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function vecKey(vector: Vec3): string {
  return `${vector[0]},${vector[1]},${vector[2]}`;
}

/** Positive quarter turns are counterclockwise when viewed from the positive end of the axis. */
export function rotationMatrix(axis: Axis, quarterTurns: number): Mat3 {
  const turns = ((quarterTurns % 4) + 4) % 4;
  if (turns === 0) return IDENTITY_MATRIX;

  const base = POSITIVE_QUARTER_TURNS[axis];
  let result = base;
  for (let index = 1; index < turns; index += 1) {
    result = multiplyMatrices(base, result);
  }
  return result;
}

export function isIdentityMatrix(matrix: Mat3): boolean {
  return (
    matrix[0] === 1 &&
    matrix[1] === 0 &&
    matrix[2] === 0 &&
    matrix[3] === 0 &&
    matrix[4] === 1 &&
    matrix[5] === 0 &&
    matrix[6] === 0 &&
    matrix[7] === 0 &&
    matrix[8] === 1
  );
}

export function faceFromNormal(normal: Vec3): Face {
  const [x, y, z] = normal;
  const abs = [Math.abs(x), Math.abs(y), Math.abs(z)];
  const dominant = abs.indexOf(Math.max(...abs));
  const sign = [x, y, z][dominant] >= 0 ? 1 : -1;

  if (dominant === 0) return sign > 0 ? 'R' : 'L';
  if (dominant === 1) return sign > 0 ? 'U' : 'D';
  return sign > 0 ? 'F' : 'B';
}

export function normalForFace(face: Face): Vec3 {
  return FACE_NORMALS[face];
}

export function faceletIndex(face: Face, position: Vec3): number {
  const [x, y, z] = position;
  switch (face) {
    case 'U':
      return (z + 1) * 3 + (x + 1);
    case 'R':
      return 9 + (1 - y) * 3 + (1 - z);
    case 'F':
      return 18 + (1 - y) * 3 + (x + 1);
    case 'D':
      return 27 + (1 - z) * 3 + (x + 1);
    case 'L':
      return 36 + (1 - y) * 3 + (z + 1);
    case 'B':
      return 45 + (1 - y) * 3 + (1 - x);
  }
}

export function faceFromIndex(index: number): Face {
  return FACES[Math.floor(index / 9)];
}

export function positionOnAxis(position: Vec3, axis: Axis): number {
  return position[AXIS_INDEX[axis]];
}

export function matrixToQuaternion(matrix: Mat3): [number, number, number, number] {
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = matrix;
  const trace = m00 + m11 + m22;

  if (trace > 0) {
    const scale = Math.sqrt(trace + 1) * 2;
    return [
      (m21 - m12) / scale,
      (m02 - m20) / scale,
      (m10 - m01) / scale,
      0.25 * scale,
    ];
  }

  if (m00 > m11 && m00 > m22) {
    const scale = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return [
      0.25 * scale,
      (m01 + m10) / scale,
      (m02 + m20) / scale,
      (m21 - m12) / scale,
    ];
  }

  if (m11 > m22) {
    const scale = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return [
      (m01 + m10) / scale,
      0.25 * scale,
      (m12 + m21) / scale,
      (m02 - m20) / scale,
    ];
  }

  const scale = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return [
    (m02 + m20) / scale,
    (m12 + m21) / scale,
    0.25 * scale,
    (m10 - m01) / scale,
  ];
}
