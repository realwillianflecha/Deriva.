'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import type { Group } from 'three';
import { useUiStore } from '@/state/uiStore';
import { useGameStore } from '@/state/gameStore';
import { clamp } from '@/lib/physics';

const THIRD_PERSON_DIR = new Vector3(0, 3, 9).normalize();
const COCKPIT_OFFSET = new Vector3(0, 0.3, -1.0);
const MIN_ZOOM = 4;
const MAX_ZOOM = 40;
const DEFAULT_ZOOM = 9;

const desiredPosition = new Vector3();
const lookTarget = new Vector3();
const offsetWorld = new Vector3();

export default function CameraRig({
  shipRef,
  characterPositionRef,
  cameraLookRef,
}: {
  shipRef: React.RefObject<Group | null>;
  characterPositionRef: React.RefObject<Vector3>;
  cameraLookRef: React.RefObject<Quaternion>;
}) {
  const zoom = useRef(DEFAULT_ZOOM);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (useUiStore.getState().cameraMode !== 'third') return;
      zoom.current = clamp(zoom.current + Math.sign(event.deltaY) * 1.2, MIN_ZOOM, MAX_ZOOM);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  useFrame(({ camera }) => {
    const look = cameraLookRef.current;

    // A pie siempre en primera persona, sobre el personaje — no tiene sentido un modo
    // tercera persona sin un cuerpo visible que mirar, y así no hace falta bloquear la
    // tecla C mientras se camina (el toggle simplemente no se lee acá).
    if (useGameStore.getState().flightMode === 'onfoot') {
      camera.position.copy(characterPositionRef.current);
      camera.quaternion.copy(look);
      return;
    }

    const ship = shipRef.current;
    if (!ship) return;

    const cameraMode = useUiStore.getState().cameraMode;

    if (cameraMode === 'first') {
      offsetWorld.copy(COCKPIT_OFFSET).applyQuaternion(look);
      camera.position.copy(ship.position).add(offsetWorld);
      camera.quaternion.copy(look);
      return;
    }

    offsetWorld.copy(THIRD_PERSON_DIR).multiplyScalar(zoom.current).applyQuaternion(look);
    desiredPosition.copy(ship.position).add(offsetWorld);
    camera.position.copy(desiredPosition);

    lookTarget.copy(ship.position);
    camera.lookAt(lookTarget);
  });

  return null;
}
