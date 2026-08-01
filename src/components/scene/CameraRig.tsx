'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { useUiStore } from '@/state/uiStore';
import { clamp } from '@/lib/physics';

const THIRD_PERSON_DIR = new Vector3(0, 3, 9).normalize();
const COCKPIT_OFFSET = new Vector3(0, 0.3, -1.0);
const MIN_ZOOM = 4;
const MAX_ZOOM = 40;
const DEFAULT_ZOOM = 9;

const desiredPosition = new Vector3();
const lookTarget = new Vector3();
const offsetWorld = new Vector3();

export default function CameraRig({ shipRef }: { shipRef: React.RefObject<Group | null> }) {
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
    const ship = shipRef.current;
    if (!ship) return;

    const cameraMode = useUiStore.getState().cameraMode;

    if (cameraMode === 'first') {
      offsetWorld.copy(COCKPIT_OFFSET).applyQuaternion(ship.quaternion);
      camera.position.copy(ship.position).add(offsetWorld);
      camera.quaternion.copy(ship.quaternion);
      return;
    }

    offsetWorld.copy(THIRD_PERSON_DIR).multiplyScalar(zoom.current).applyQuaternion(ship.quaternion);
    desiredPosition.copy(ship.position).add(offsetWorld);
    camera.position.copy(desiredPosition);

    lookTarget.copy(ship.position);
    camera.lookAt(lookTarget);
  });

  return null;
}
