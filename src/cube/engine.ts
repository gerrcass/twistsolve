import {
  AXIS_INDEX,
  FACE_OFFSETS,
  FACE_TURNS,
  FACES,
  IDENTITY_MATRIX,
} from './constants';
import {
  faceFromNormal,
  faceletIndex,
  isIdentityMatrix,
  multiplyMatrices,
  multiplyMatrixVector,
  rotationMatrix,
  roundVec3,
  vecEquals,
  vecKey,
} from './linear';
import type { Cubie, CubeState, Mat3, Move, Sticker, Vec3 } from './types';

function stickersForHome(home: Vec3): Sticker[] {
  const [x, y, z] = home;
  const normals: Vec3[] = [];
  if (x === 1) normals.push([1, 0, 0]);
  if (x === -1) normals.push([-1, 0, 0]);
  if (y === 1) normals.push([0, 1, 0]);
  if (y === -1) normals.push([0, -1, 0]);
  if (z === 1) normals.push([0, 0, 1]);
  if (z === -1) normals.push([0, 0, -1]);

  return normals.map((normal) => ({
    normal,
    color: faceFromNormal(normal),
  }));
}

export function createSolvedCube(): CubeState {
  const cubies: Cubie[] = [];

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        if (x === 0 && y === 0 && z === 0) continue;
        const home: Vec3 = [x, y, z];
        cubies.push({
          id: vecKey(home),
          home,
          position: home,
          rotation: IDENTITY_MATRIX,
          stickers: stickersForHome(home),
        });
      }
    }
  }

  return { cubies };
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const turn = FACE_TURNS[move.face];
  const matrix = rotationMatrix(turn.axis, turn.direction * move.amount);

  let changed = false;
  const cubies = state.cubies.map((cubie) => {
    if (cubie.position[AXIS_INDEX[turn.axis]] !== turn.layer) {
      return cubie;
    }

    changed = true;
    return {
      ...cubie,
      position: roundVec3(multiplyMatrixVector(matrix, cubie.position)),
      rotation: multiplyMatrices(matrix, cubie.rotation) as Mat3,
    };
  });

  return changed ? { cubies } : state;
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

export function faceletString(state: CubeState): string {
  const cells = new Array<string>(54).fill('?');

  for (const cubie of state.cubies) {
    for (const sticker of cubie.stickers) {
      const normal = roundVec3(
        multiplyMatrixVector(cubie.rotation, sticker.normal),
      );
      const face = faceFromNormal(normal);
      const index = faceletIndex(face, cubie.position);

      if (cells[index] !== '?') {
        throw new Error(
          `Two Stickers occupy Facelet ${index} on Face ${face} at ${cubie.position.join(',')}`,
        );
      }
      cells[index] = sticker.color;
    }
  }

  if (cells.includes('?')) {
    throw new Error('Cube State is missing one or more Facelets');
  }

  return cells.join('');
}

export function isSolved(state: CubeState): boolean {
  const facelets = faceletString(state);

  return FACES.every((face) => {
    const offset = FACE_OFFSETS[face];
    const first = facelets[offset];
    for (let index = 1; index < 9; index += 1) {
      if (facelets[offset + index] !== first) return false;
    }
    return true;
  });
}

export function isAtHome(state: CubeState): boolean {
  return state.cubies.every(
    (cubie) =>
      vecEquals(cubie.position, cubie.home) &&
      isIdentityMatrix(cubie.rotation),
  );
}

export interface MoveTurn {
  axis: 'x' | 'y' | 'z';
  layer: -1 | 1;
  /** Shortest signed quarter turns: -1, +1, or 2. */
  quarterTurns: -1 | 1 | 2;
}

export function getMoveTurn(move: Move): MoveTurn {
  const turn = FACE_TURNS[move.face];
  const raw = turn.direction * move.amount;
  const normalized = ((raw % 4) + 4) % 4;
  const quarterTurns: MoveTurn['quarterTurns'] =
    normalized === 3 ? -1 : normalized === 2 ? 2 : 1;

  return { axis: turn.axis, layer: turn.layer, quarterTurns };
}
