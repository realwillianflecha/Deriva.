'use client';

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, Euler, Quaternion } from 'three';
import type { Group } from 'three';
import { useFlightControls, clampPitch } from '@/lib/flightControls';
import { clamp } from '@/lib/physics';
import { useGameStore } from '@/state/gameStore';
import { PLANETS } from '@/content/planets/planetData';
import type { PlanetId } from '@/state/types';
import {
  DESCENT_START_ALTITUDE,
  SURFACE_ASCEND_EXIT_ALTITUDE,
  DESCENT_THRUST_MULTIPLIER,
  DESCENT_MAX_FALL_SPEED,
  DESCENT_MAX_RISE_SPEED,
  SURFACE_LIFTOFF_HOLD_SECONDS,
  SHIP_ROTATION_SMOOTHING,
  NAV_UPDATE_INTERVAL,
} from '@/lib/constants';

const euler = new Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new Quaternion();
// El grupo interno de Ship.tsx ya corrige el modelo para que "adelante" sea -Z local
// (la convención de vuelo libre) — eso significa que a orientación identidad la nave
// queda ACOSTADA (morro apuntando en horizontal). Para que se vea parada de pie en el
// piso hay que rotar ese morro 90° hacia arriba, de -Z a +Y.
const STANDING_QUATERNION = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0, 'YXZ'));

/**
 * Modo de vuelo acotado para entrada/aterrizaje/despegue: sin WASD, sin boost, sin
 * traslación horizontal — solo Espacio para frenar la caída o impulsarse hacia arriba,
 * contra la gravedad REAL del planeta activo (nunca una constante de empuje suelta, ver
 * DESCENT_THRUST_MULTIPLIER). La cámara mira libre (cameraLookRef) sin que la nave gire
 * con ella — la nave mantiene la orientación con la que entró.
 */
export default function DescentController({
  shipRef,
  cameraLookRef,
}: {
  shipRef: React.RefObject<Group | null>;
  cameraLookRef: React.RefObject<Quaternion>;
}) {
  const { input, consumeLook } = useFlightControls();

  const verticalVelocity = useRef(0);
  const lookYaw = useRef(0);
  const lookPitch = useRef(0);
  const liftoffHoldTime = useRef(0);
  const navAccum = useRef(0);
  // Cuánto hay que levantar el origen del grupo de la nave para que la BASE del modelo
  // (no su centro/pivote de vuelo) quede apoyada en el piso -- el offset de recentrado en
  // Ship.tsx se tuneó para que se vea bien volando, no para pararse. Medido con la caja
  // envolvente real del modelo en vez de un número mágico a ojo, porque si el modelo de
  // la nave cambia más adelante (ver charla sobre mejorarlo en Blender) esto se
  // recalcula solo.
  const groundClearance = useRef(0);

  // Se ejecuta una sola vez, al montar (que coincide con el instante en que flightMode
  // pasa a 'descending' -- persiste montado durante landed/ascending sin volver a correr).
  // useLayoutEffect (no useEffect) para que corra ANTES del primer paint -- si no, se
  // alcanza a ver un frame con la nave en la posición vieja antes de la corrección.
  useLayoutEffect(() => {
    const ship = shipRef.current;
    if (!ship) return;

    ship.quaternion.copy(STANDING_QUATERNION);
    ship.position.set(0, 0, 0);
    ship.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(ship);
    groundClearance.current = Number.isFinite(box.min.y) ? -box.min.y : 0;

    // Si el juego arranca ya 'landed' (empezamos parados en la Tierra, no en el
    // espacio), la nave tiene que aparecer directo en el piso, no caer desde
    // DESCENT_START_ALTITUDE -- esa altura de entrada es solo para cuando se viene de
    // 'entering' (llegada real desde el espacio).
    const enteringFromSpace = useGameStore.getState().flightMode !== 'landed';
    const startAltitude = enteringFromSpace ? DESCENT_START_ALTITUDE : 0;
    ship.position.y = startAltitude + groundClearance.current;
    lookYaw.current = 0;
    lookPitch.current = 0;
    cameraLookRef.current.identity();
    // Si venimos de una entrada real desde el espacio, ya se estaba cayendo rápido antes
    // de aparecer acá -- arrancar la caída ya al máximo (no desde cero, como si recién
    // empezara a acelerar) y que el jugador la frene de a poco con Espacio. Si en cambio
    // el juego arranca 'landed' en la Tierra, no hay caída que continuar: quieta en 0.
    verticalVelocity.current = enteringFromSpace ? -DESCENT_MAX_FALL_SPEED : 0;
    liftoffHoldTime.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const ship = shipRef.current;
    if (!ship) return;

    const store = useGameStore.getState();
    const surfacePlanetId = store.surfacePlanetId as PlanetId | null;
    if (!surfacePlanetId) return;
    const gravity = PLANETS[surfacePlanetId].gravity;

    if (store.flightMode === 'exiting') {
      // Mismo motivo que el branch de 'entering' en FlightController: el destello tarda
      // en llegar a blanco total, así que hay que seguir subiendo a la última velocidad
      // conocida en vez de clavarse en seco apenas empieza a aparecer.
      ship.position.y += verticalVelocity.current * delta;
      return;
    }

    // Igual que en FlightController: con un panel narrativo abierto (ej. el briefing de
    // combustible, que ahora se ve parado en la Tierra) no hay que leer input de vuelo —
    // si no, apoyar la mano en Espacio dispara un despegue antes de elegir nada.
    const controlsActive = !store.narrativeVisible;

    if (controlsActive) {
      const { yawDelta, pitchDelta } = consumeLook();
      lookYaw.current += yawDelta;
      lookPitch.current = clampPitch(lookPitch.current + pitchDelta);
      euler.set(lookPitch.current, lookYaw.current, 0);
      targetQuaternion.setFromEuler(euler);
      const rotationLerp = 1 - Math.exp(-SHIP_ROTATION_SMOOTHING * delta);
      cameraLookRef.current.slerp(targetQuaternion, rotationLerp);
    }

    const thrustHeld = controlsActive && input.current.up;

    if (store.flightMode === 'landed') {
      verticalVelocity.current = 0;
      if (thrustHeld) {
        liftoffHoldTime.current += delta;
        if (liftoffHoldTime.current >= SURFACE_LIFTOFF_HOLD_SECONDS) {
          useGameStore.getState().beginAscent();
        }
      } else {
        liftoffHoldTime.current = 0;
      }
    } else if (store.flightMode === 'descending' || store.flightMode === 'ascending') {
      const thrustAccel = thrustHeld ? gravity * DESCENT_THRUST_MULTIPLIER : 0;
      verticalVelocity.current += (thrustAccel - gravity) * delta;
      verticalVelocity.current = clamp(verticalVelocity.current, -DESCENT_MAX_FALL_SPEED, DESCENT_MAX_RISE_SPEED);

      ship.position.y += verticalVelocity.current * delta;

      // El piso frena en groundClearance (donde la BASE del modelo toca y=0, no donde
      // está el origen del grupo) en los dos modos -- en 'ascending', si no se sostiene
      // Espacio a tiempo, la gravedad podría empujar la posición por debajo del piso.
      if (ship.position.y <= groundClearance.current) {
        ship.position.y = groundClearance.current;
        verticalVelocity.current = 0;
      }

      if (store.flightMode === 'descending' && ship.position.y <= groundClearance.current) {
        useGameStore.getState().touchdown();
      } else if (
        store.flightMode === 'ascending' &&
        ship.position.y >= groundClearance.current + SURFACE_ASCEND_EXIT_ALTITUDE
      ) {
        useGameStore.getState().beginExit();
      }
    }

    navAccum.current += delta;
    if (navAccum.current >= NAV_UPDATE_INTERVAL) {
      navAccum.current = 0;
      useGameStore.getState().updateNav({
        // Relativa a groundClearance, no al origen crudo del grupo, para que el HUD
        // muestre 0.0m parado en el piso en vez de un número fraccionario arbitrario.
        altitude: ship.position.y - groundClearance.current,
        verticalSpeed: verticalVelocity.current,
      });
    }
  });

  return null;
}
