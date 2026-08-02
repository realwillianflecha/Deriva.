'use client';

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import type { Group } from 'three';
import { useFlightControls, clampPitch } from '@/lib/flightControls';
import { canvasRegistry } from '@/lib/canvasRegistry';
import { clamp } from '@/lib/physics';
import { useGameStore } from '@/state/gameStore';
import { PLANETS, EARTH_MARS_DISTANCE } from '@/content/planets/planetData';
import type { PlanetId } from '@/state/types';
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
  ARRIVAL_RADIUS_FACTOR,
  DEPARTURE_HYSTERESIS_FACTOR,
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
const MARS_ARRIVAL_RADIUS = PLANETS.mars.radius * ARRIVAL_RADIUS_FACTOR;

// Destinos "sin misión" — llegar dispara el aterrizaje directo (sin diálogo de sitio),
// a diferencia de Marte que sigue pasando por landing-brief. Cada uno con su propio radio
// de llegada proporcional a su propio tamaño real.
type OtherPlanetId = 'earth' | 'mercury' | 'venus';
const OTHER_PLANETS: { id: OtherPlanetId; pos: Vector3; arrivalRadius: number }[] = (
  ['earth', 'mercury', 'venus'] as const
).map((id) => ({
  id,
  pos: new Vector3(...PLANETS[id].position),
  arrivalRadius: PLANETS[id].radius * ARRIVAL_RADIUS_FACTOR,
}));

const repositionOffset = new Vector3();

export default function FlightController({
  shipRef,
  cameraLookRef,
}: {
  shipRef: React.RefObject<Group | null>;
  cameraLookRef: React.RefObject<Quaternion>;
}) {
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
  const awayFromPlanet = useRef<Record<OtherPlanetId, boolean>>({
    earth: false,
    mercury: false,
    venus: false,
  });

  // Si venimos de despegar de un planeta (surfacePlanetId seteado por el mundo de
  // superficie), reposicionar la nave arriba de ESE planeta al remontar — misma fórmula
  // proporcional que SHIP_START en SceneRoot, generalizada a cualquier planeta.
  useLayoutEffect(() => {
    const ship = shipRef.current;
    const surfacePlanetId = useGameStore.getState().surfacePlanetId;
    if (!ship || !surfacePlanetId) return;

    const planet = PLANETS[surfacePlanetId as PlanetId];
    ship.position.set(
      planet.position[0],
      planet.position[1] + planet.radius * 1.03,
      planet.position[2] + planet.radius * 0.07,
    );
    repositionOffset.set(0, planet.radius * 1.03, planet.radius * 0.07).normalize();
    velocity.current.copy(repositionOffset).multiplyScalar(80);
    useGameStore.setState({ surfacePlanetId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ camera }, delta) => {
    const ship = shipRef.current;
    if (!ship) return;

    const store = useGameStore.getState();
    if (store.phase !== 'flight') return;

    if (store.flightMode === 'entering') {
      // El destello tapa el swap de mundo, pero el fade-in tarda un rato en llegar a
      // blanco total -- mientras tanto la escena espacial sigue siendo visible, así que
      // la nave tiene que seguir en línea recta a la última velocidad conocida, sin
      // frenar de golpe (nada de input/gatillos/daño acá, solo seguir de largo).
      ship.position.addScaledVector(velocity.current, delta);
      return;
    }

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
    // En vuelo libre, mirar y orientar la nave son la misma cosa — se espeja acá para que
    // CameraRig (que siempre lee de cameraLookRef, nunca de ship.quaternion directo) se
    // comporte igual que antes en este modo.
    cameraLookRef.current.copy(ship.quaternion);

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
      distanceToMars - PLANETS.mars.radius <= MARS_ARRIVAL_RADIUS
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

    // Tierra/Venus/Mercurio no tienen misión narrativa — llegar dispara el aterrizaje
    // directo. Histéresis de salida: hay que haberse alejado más allá de
    // arrivalRadius*DEPARTURE_HYSTERESIS_FACTOR al menos una vez antes de que se arme el
    // disparador de nuevo — si no, la Tierra (donde arranca la nave, ya adentro de su
    // propio radio de llegada) dispararía el aterrizaje en el primer frame de vuelo.
    if (!store.narrativeVisible) {
      for (const { id, pos, arrivalRadius } of OTHER_PLANETS) {
        const dist = ship.position.distanceTo(pos) - PLANETS[id].radius;
        if (dist > arrivalRadius * DEPARTURE_HYSTERESIS_FACTOR) {
          awayFromPlanet.current[id] = true;
        } else if (awayFromPlanet.current[id] && dist <= arrivalRadius) {
          awayFromPlanet.current[id] = false;
          // A diferencia de Marte (que sí suelta el mouse, para mostrar el panel de
          // elegir sitio), acá no hay ningún panel narrativo — el pointer lock se
          // mantiene enganchado sin interrupción durante toda la secuencia de aterrizaje.
          useGameStore.getState().beginDescent(id);
          break;
        }
      }
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
