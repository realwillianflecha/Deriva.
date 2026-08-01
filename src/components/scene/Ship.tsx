'use client';

import { forwardRef } from 'react';
import type { Group } from 'three';
import { useUiStore } from '@/state/uiStore';
import { FalconHeavyModel } from './generated/FalconHeavyModel';

const SHIP_MODEL_SCALE = 0.7;
const MODEL_RECENTER: [number, number, number] = [0.046, 0.889, -0.002];
const CAMERA_LOCAL: [number, number, number] = [0, 0.3, -1.0];

const Ship = forwardRef<Group, { position?: [number, number, number] }>(function Ship(
  { position = [0, 0, 0] },
  ref,
) {
  const cameraMode = useUiStore((s) => s.cameraMode);
  const inCockpit = cameraMode === 'first';

  return (
    <group ref={ref} position={position}>
      <group
        visible={!inCockpit}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={SHIP_MODEL_SCALE}
      >
        <group position={MODEL_RECENTER}>
          <FalconHeavyModel />
        </group>
      </group>

      {inCockpit && (
        <group position={CAMERA_LOCAL}>
          <mesh position={[0, -0.32, -0.7]}>
            <boxGeometry args={[1.1, 0.18, 0.7]} />
            <meshStandardMaterial color="#12141a" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[-0.55, 0.05, -0.7]} rotation={[0, 0.25, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.6]} />
            <meshStandardMaterial color="#1c1f26" roughness={0.7} />
          </mesh>
          <mesh position={[0.55, 0.05, -0.7]} rotation={[0, -0.25, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.6]} />
            <meshStandardMaterial color="#1c1f26" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default Ship;
