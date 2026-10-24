import { Suspense, useMemo } from 'react';
import {
  ContactShadows,
  OrbitControls,
  Sparkles,
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  PCFShadowMap,
} from 'three';
import type { TurnAnimationState } from '../animation';
import type { CubeState } from '../cube';
import { CubieMesh } from './CubieMesh';

interface CubeCanvasProps {
  cube: CubeState;
  animation: TurnAnimationState | null;
  reducedMotion: boolean;
}

function ResponsiveCube({
  cube,
  animation,
}: {
  cube: CubeState;
  animation: TurnAnimationState | null;
}) {
  const { viewport } = useThree();
  const scale = Math.min(1, Math.max(0.58, viewport.width / 5.6));

  return (
    <group scale={scale} position={[0, 0.08, 0]}>
      {cube.cubies.map((cubie) => (
        <CubieMesh
          key={cubie.id}
          cubie={cubie}
          animation={animation}
        />
      ))}
    </group>
  );
}

function Studio({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#fff2dc', '#080a0d', 0.65]} />

      <directionalLight
        castShadow
        position={[5.5, 8.5, 6.5]}
        intensity={2.1}
        color="#fff1d6"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-5, 5, 5, -5, 0.1, 30]}
        />
      </directionalLight>

      <directionalLight
        position={[-7, 3.5, -4]}
        intensity={0.5}
        color="#9fa9c9"
      />
      <pointLight
        position={[0, -2.4, 4.2]}
        intensity={0.45}
        color="#f2b34b"
      />

      <ContactShadows
        position={[0, -1.78, 0]}
        opacity={0.55}
        scale={9}
        blur={3.2}
        far={4.5}
        color="#000000"
      />

      <mesh rotation-x={-Math.PI / 2} position-y={-1.77}>
        <ringGeometry args={[2.35, 2.37, 96]} />
        <meshBasicMaterial
          color="#f2b34b"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {!reducedMotion && (
        <Sparkles
          count={26}
          scale={[7, 4.5, 7]}
          position={[0, 0.1, 0]}
          size={1.6}
          speed={0.18}
          opacity={0.28}
          color="#f2b34b"
        />
      )}
    </>
  );
}

export function CubeCanvas({
  cube,
  animation,
  reducedMotion,
}: CubeCanvasProps) {
  const camera = useMemo(
    () => ({ position: [6.5, 5.4, 7.9] as [number, number, number], fov: 33 }),
    [],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={camera}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.shadowMap.type = PCFShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <Studio reducedMotion={reducedMotion} />
        <ResponsiveCube cube={cube} animation={animation} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping={!reducedMotion}
          dampingFactor={0.075}
          rotateSpeed={0.65}
          zoomSpeed={0.7}
          minDistance={6.2}
          maxDistance={13}
          minPolarAngle={0.18}
          maxPolarAngle={Math.PI - 0.18}
          target={[0, 0.08, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
