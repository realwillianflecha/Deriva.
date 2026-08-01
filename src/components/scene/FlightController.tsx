'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import type { Group } from 'three';
import { useFlightControls, clampPitch } from '@/lib/flightControls';
import { canvasRegistry } from '@/lib/canvasRegistry';
import { clamp } from '@/lib/physics';
import { useGameStore } from '@/state/gameStore';
import { PLANETS, EARTH_MARS_DISTANCE } from '@/content/planets/planetData';
import {
  SHIP_BASE_ACCEL,
  SHIP_MAX_SPEED,
  SHIP_BOOST_ACCEL_MULT,
  SHIP_BOOST_MAX_SPEED,
  SHIP_LINEAR_DAMPING,
  SHIP_LOW_FUEL_ACCEL_MULT,
  FUEL_MAX,
  FUEL_BURN_RATE,
  FUEL_BOOST_EXTRA_BURN_RATE,
  SHIP_ROTATION_SMOOTHING,
  ARRIVAL_RADIUS,
  FLARE_PROGRESS_THRESHOLD,
  FLARE_FALLBACK_SECONDS,
  NAV_UPDATE_INTERVAL,
} from '@/lib/constants';

const localDir = new Vector3();
const worldDir = new Vector3();
const marsNdc = new Vector3();
const euler = new Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new Quaternion();
const MARS_POS = new Vector3(...PLANETS.mars.position);

export default function FlightController({ shipRef }: { shipRef: React.RefObject<Group | null> }) {
  const { input, consumeLook } = useFlightControls();

  const velocity = useRef(new Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const fuelRef = useRef(100);
  const navAccum = useRef(0);
  const elapsed = useRef(0);
  const topSpeed = useRef(0);
  const usedBoost = useRef(false);
  const flareFired = useRef(false);
  const arrived = useRef(false);
  const fuelInitialized = useRef(false);
  const fuelMax = useRef(FUEL_MAX);

  useFrame(({ camera }, delta) => {
    const ship = shipRef.current;
    if (!ship) return;

    const store = useGameStore.getState();
    if (store.phase !== 'flight') return;

    if (!fuelInitialized.current) {
      fuelRef.current = store.fuel;
      fuelMax.current = store.fuel;
      fuelInitialized.current = true;
    }

    const locked = typeof document !== 'undefined' && document.pointerLockElement === canvasRegistry.el;
    const controlsActive = locked && !store.narrativeVisible;

    if (controlsActive) {
      const { yawDelta, pitchDelta } = consumeLook();
      yaw.current += yawDelta;
      pitch.current = clampPitch(pitch.current + pitchDelta);
    }

    euler.set(pitch.current, yaw.current, 0);
    targetQuaternion.setFromEuler(euler);
    const rotationLerp = 1 - Math.exp(-SHIP_ROTATION_SMOOTHING * delta);
    ship.quaternion.slerp(targetQuaternion, rotationLerp);

    if (controlsActive) {
      const i = input.current;
      localDir.set(
        (i.right ? 1 : 0) - (i.left ? 1 : 0),
        (i.up ? 1 : 0) - (i.down ? 1 : 0),
        (i.back ? 1 : 0) - (i.forward ? 1 : 0),
      );

      const thrusting = localDir.lengthSq() > 0;
      if (thrusting) localDir.normalize();

      const boosting = i.boost && fuelRef.current > 0;
      if (boosting) usedBoost.current = true;

      const accelMult =
        (boosting ? SHIP_BOOST_ACCEL_MULT : 1) * (fuelRef.current <= 0 ? SHIP_LOW_FUEL_ACCEL_MULT : 1);
      const accel = SHIP_BASE_ACCEL * accelMult;

      if (thrusting) {
        worldDir.copy(localDir).applyQuaternion(ship.quaternion);
        velocity.current.addScaledVector(worldDir, accel * delta);

        const burn = (FUEL_BURN_RATE + (boosting ? FUEL_BOOST_EXTRA_BURN_RATE : 0)) * delta;
        fuelRef.current = clamp(fuelRef.current - burn, 0, fuelMax.current);
      }
    }

    const dampFactor = Math.max(0, 1 - SHIP_LINEAR_DAMPING * delta);
    velocity.current.multiplyScalar(dampFactor);

    const cap = input.current.boost ? SHIP_BOOST_MAX_SPEED : SHIP_MAX_SPEED;
    if (velocity.current.length() > cap) velocity.current.setLength(cap);

    ship.position.addScaledVector(velocity.current, delta);

    const speed = velocity.current.length();
    topSpeed.current = Math.max(topSpeed.current, speed);
    elapsed.current += delta;

    const distanceToMars = ship.position.distanceTo(MARS_POS);
    const progress = clamp(1 - distanceToMars / EARTH_MARS_DISTANCE, 0, 1);

    if (
      !flareFired.current &&
      !store.narrativeVisible &&
      (progress >= FLARE_PROGRESS_THRESHOLD || elapsed.current >= FLARE_FALLBACK_SECONDS)
    ) {
      flareFired.current = true;
      if (typeof document !== 'undefined') document.exitPointerLock();
      useGameStore.getState().triggerFlare();
    }

    if (
      !arrived.current &&
      !store.narrativeVisible &&
      distanceToMars - PLANETS.mars.radius <= ARRIVAL_RADIUS
    ) {
      arrived.current = true;
      if (typeof document !== 'undefined') document.exitPointerLock();
      useGameStore.getState().completeFlight({
        fuelRemainingPercent: fuelRef.current,
        topSpeed: topSpeed.current,
        travelTimeSeconds: elapsed.current,
        boostUsed: usedBoost.current,
      });
    }

    navAccum.current += delta;
    if (navAccum.current >= NAV_UPDATE_INTERVAL) {
      navAccum.current = 0;

      marsNdc.copy(MARS_POS).project(camera);
      let onScreen = marsNdc.z < 1 && Math.abs(marsNdc.x) <= 1 && Math.abs(marsNdc.y) <= 1;
      let ndcX = marsNdc.x;
      let ndcY = marsNdc.y;
      if (marsNdc.z > 1) {
        ndcX = -ndcX;
        ndcY = -ndcY;
        onScreen = false;
      }
      const angle = Math.atan2(ndcY, ndcX);

      useGameStore.getState().updateNav({
        fuel: fuelRef.current,
        velocityMagnitude: speed,
        distanceToMars,
        travelProgress: progress,
        headingScreen: { onScreen, angle },
      });
    }
  });

  return null;
}
