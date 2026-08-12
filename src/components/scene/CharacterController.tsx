'use client';

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import { useFlightControls, clampPitch } from '@/lib/flightControls';
import { useGameStore } from '@/state/gameStore';
import { getTerrainHeight } from '@/lib/terrain';
import {
  EYE_HEIGHT,
  CHARACTER_MOVE_SPEED,
  CHARACTER_SPRINT_MULT,
  CHARACTER_SPAWN_OFFSET,
  ENTER_SHIP_RADIUS,
  NAV_UPDATE_INTERVAL,
  OCEAN_Y,
  SWIM_TRIGGER_DEPTH,
  SWIM_FLOAT_DEPTH,
  CHARACTER_SWIM_SPEED,
  CHARACTER_SWIM_SPRINT_MULT,
  ISLAND_RADIUS,
} from '@/lib/constants';

// El ruido del terreno puede dar depresiones internas por debajo de OCEAN_Y adentro de la
// isla (una hondonada, no el mar) -- por eso "estar en el agua" no puede ser solo un chequeo
// de altura: hace falta ADEMÁS estar más allá del radio de la isla, donde el mar de verdad
// empieza. Sin este chequeo de distancia, pisar una hondonada interior te ponía a "nadar"
// en la mitad de tierra firme (encontrado probando el nado de verdad, no en el diseño).
function isOverSea(x: number, z: number): boolean {
  return Math.hypot(x, z) > ISLAND_RADIUS;
}

const euler = new Euler(0, 0, 0, 'YXZ');
const moveDir = new Vector3();
const forward = new Vector3();
const right = new Vector3();

/**
 * Modo a pie: sin malla propia (la cámara ES el personaje, mismo criterio que la cabina en
 * primera persona de la nave — no hay "yo" visible). Solo se monta durante 'onfoot', que es
 * mutuamente excluyente con 'landed'/'descending'/'ascending' (donde vive DescentController)
 * — importante: los dos NUNCA están montados a la vez, porque ambos llaman a
 * useFlightControls() por su cuenta y compartir cameraLookRef entre dos consumidores
 * simultáneos rompería el mouse-look (encontrado en la validación del diseño).
 */
export default function CharacterController({
  characterPositionRef,
  cameraLookRef,
}: {
  characterPositionRef: React.RefObject<Vector3>;
  cameraLookRef: React.RefObject<Quaternion>;
}) {
  const { input, consumeLook } = useFlightControls();

  const lookYaw = useRef(0);
  const lookPitch = useRef(0);
  const navAccum = useRef(0);
  // Arranca en true (no false) -- si el jugador sigue apretando E en el mismo frame en que
  // se disparó la transición hacia 'onfoot', este componente se monta con la tecla todavía
  // físicamente apretada (no hay keyup a mitad de una pulsación). Arrancar en true lo trata
  // como "ya estaba apretada", evita un falso flanco que te devolvería a la nave al instante.
  const prevInteract = useRef(true);

  useLayoutEffect(() => {
    const [x, z] = CHARACTER_SPAWN_OFFSET;
    characterPositionRef.current.set(x, getTerrainHeight(x, z) + EYE_HEIGHT, z);
    lookYaw.current = 0;
    lookPitch.current = 0;
    cameraLookRef.current.identity();
    prevInteract.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    const controlsActive = !store.narrativeVisible;

    if (controlsActive) {
      const { yawDelta, pitchDelta } = consumeLook();
      lookYaw.current += yawDelta;
      lookPitch.current = clampPitch(lookPitch.current + pitchDelta);
    }
    euler.set(lookPitch.current, lookYaw.current, 0);
    // Sin slerp: una cabeza humana responde al mouse al instante, no tiene la inercia
    // "pesada" que sí tiene la nave (SHIP_ROTATION_SMOOTHING no aplica acá a propósito).
    cameraLookRef.current.setFromEuler(euler);

    const pos = characterPositionRef.current;

    // Se puede vadear en agua de hasta SWIM_TRIGGER_DEPTH sin que arranque a nadar de
    // verdad (si no, tocar el borde mojado de la playa ya te pondría a nadar). Se decide
    // con la posición de ANTES de moverse -- a lo sumo un frame de desfase justo en el
    // borde, imperceptible, y evita tener que mover primero para saber a qué velocidad
    // moverse.
    const swimming = isOverSea(pos.x, pos.z) && getTerrainHeight(pos.x, pos.z) < OCEAN_Y - SWIM_TRIGGER_DEPTH;

    if (controlsActive) {
      const i = input.current;
      // Movimiento relativo solo al yaw (nunca al pitch) — mirar hacia arriba/abajo no
      // tiene que acelerar ni frenar la caminata/nado.
      forward.set(-Math.sin(lookYaw.current), 0, -Math.cos(lookYaw.current));
      right.set(Math.cos(lookYaw.current), 0, -Math.sin(lookYaw.current));
      moveDir.set(0, 0, 0);
      if (i.forward) moveDir.add(forward);
      if (i.back) moveDir.sub(forward);
      if (i.right) moveDir.add(right);
      if (i.left) moveDir.sub(right);
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const baseSpeed = swimming ? CHARACTER_SWIM_SPEED : CHARACTER_MOVE_SPEED;
        const sprintMult = swimming ? CHARACTER_SWIM_SPRINT_MULT : CHARACTER_SPRINT_MULT;
        const speed = baseSpeed * (i.boost ? sprintMult : 1);
        pos.x += moveDir.x * speed * delta;
        pos.z += moveDir.z * speed * delta;
      }
    }

    // Nadando, flota cerca de la superficie (cabeza afuera) en vez de seguir el relieve
    // real del fondo marino -- caminando en tierra (o vadeando, incluso en alguna hondonada
    // interior por debajo del nivel del mar), sigue pegado al terreno como siempre. Sin
    // buceo/inmersión en esta primera versión: solo nado de superficie. Mismo gate de
    // isOverSea que la velocidad de movimiento (ver arriba) -- si no, una hondonada interior
    // te dejaba "flotando" a profundidad fija en vez de caminar por el fondo, aunque
    // `swimming` ya diera bien false para la velocidad.
    const groundHeight = getTerrainHeight(pos.x, pos.z);
    const floating = isOverSea(pos.x, pos.z) && groundHeight < OCEAN_Y - SWIM_TRIGGER_DEPTH;
    // + (no -): la cabeza flota POR ENCIMA del nivel del mar, no por debajo -- con el signo
    // al revés la cámara quedaba permanentemente hundida bajo la superficie, mirando el
    // mundo desde adentro del agua (encontrado en el primer test de nado: se veía todo
    // borroso y sin sentido, la cámara literalmente estaba bajo el agua todo el tiempo).
    pos.y = floating ? OCEAN_Y + SWIM_FLOAT_DEPTH : groundHeight + EYE_HEIGHT;

    const distToPad = Math.hypot(pos.x, pos.z);
    const nearShip = distToPad <= ENTER_SHIP_RADIUS;

    const interactHeld = input.current.interact;
    const interactPressed = controlsActive && interactHeld && !prevInteract.current;
    prevInteract.current = interactHeld;
    if (interactPressed && nearShip) {
      useGameStore.getState().enterShip();
    }

    navAccum.current += delta;
    if (navAccum.current >= NAV_UPDATE_INTERVAL) {
      navAccum.current = 0;
      useGameStore.getState().updateNav({ nearShip });
    }
  });

  return null;
}
