import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import type { Group } from 'three';
import type { TurnAnimationState } from '../animation';
import {
  FACE_COLORS,
  getMoveTurn,
  matrixToQuaternion,
} from '../cube';
import type { Cubie } from '../cube';

const AXIS_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
} as const;

const Z_AXIS = new Vector3(0, 0, 1);

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function stickerOrientation(normal: readonly [number, number, number]): Quaternion {
  const target = new Vector3(normal[0], normal[1], normal[2]);
  return new Quaternion().setFromUnitVectors(Z_AXIS, target);
}

interface CubieMeshProps {
  cubie: Cubie;
  animation: TurnAnimationState | null;
}

export function CubieMesh({ cubie, animation }: CubieMeshProps) {
  const group = useRef<Group>(null);
  const basePosition = useMemo(
    () =>
      new Vector3(cubie.position[0], cubie.position[1], cubie.position[2]),
    [cubie.position],
  );
  const baseQuaternion = useMemo(
    () => new Quaternion(...matrixToQuaternion(cubie.rotation)).normalize(),
    [cubie.rotation],
  );
  const stickers = useMemo(
    () =>
      cubie.stickers.map((sticker) => ({
        ...sticker,
        quaternion: stickerOrientation(sticker.normal),
      })),
    [cubie.stickers],
  );
  const tempQuaternion = useMemo(() => new Quaternion(), []);
  const tempPosition = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const mesh = group.current;
    if (!mesh) return;

    if (animation) {
      const turn = getMoveTurn(animation.move);
      const axisIndex =
        turn.axis === 'x' ? 0 : turn.axis === 'y' ? 1 : 2;

      if (cubie.position[axisIndex] === turn.layer) {
        const progress = Math.min(
          1,
          Math.max(
            0,
            (performance.now() - animation.startedAt) / animation.duration,
          ),
        );
        const angle =
          turn.quarterTurns * (Math.PI / 2) * easeInOutCubic(progress);
        tempQuaternion.setFromAxisAngle(AXIS_VECTORS[turn.axis], angle);
        tempPosition.copy(basePosition).applyQuaternion(tempQuaternion);
        mesh.position.copy(tempPosition);
        mesh.quaternion.copy(tempQuaternion).multiply(baseQuaternion);
        return;
      }
    }

    mesh.position.copy(basePosition);
    mesh.quaternion.copy(baseQuaternion);
  });

  return (
    <group ref={group}>
      <RoundedBox
        args={[0.95, 0.95, 0.95]}
        radius={0.075}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#1c1f25"
          roughness={0.34}
          metalness={0.12}
        />
      </RoundedBox>

      {stickers.map((sticker) => {
        const [nx, ny, nz] = sticker.normal;
        const frameOffset = 0.482;
        const faceOffset = 0.493;
        return (
          <group key={`${sticker.normal.join(',')}`}>
            <RoundedBox
              args={[0.82, 0.82, 0.018]}
              radius={0.07}
              smoothness={3}
              position={[
                nx * frameOffset,
                ny * frameOffset,
                nz * frameOffset,
              ]}
              quaternion={sticker.quaternion}
            >
              <meshStandardMaterial
                color="#0b0c0f"
                roughness={0.55}
                metalness={0.2}
              />
            </RoundedBox>
            <RoundedBox
              args={[0.74, 0.74, 0.016]}
              radius={0.055}
              smoothness={3}
              position={[nx * faceOffset, ny * faceOffset, nz * faceOffset]}
              quaternion={sticker.quaternion}
            >
              <meshStandardMaterial
                color={FACE_COLORS[sticker.color]}
                roughness={0.3}
                metalness={0.06}
              />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}
