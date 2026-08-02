'use client';

import { useRef } from 'react';
import { Quaternion } from 'three';
import type { Group } from 'three';
import { useGameStore } from '@/state/gameStore';
import { PLANETS, SUN } from '@/content/planets/planetData';
import Starfield from './Starfield';
import Earth from './bodies/Earth';
import Mars from './bodies/Mars';
import Mercury from './bodies/Mercury';
import Venus from './bodies/Venus';
import Sun from './bodies/Sun';
import Ship from './Ship';
import CameraRig from './CameraRig';
import FlightController from './FlightController';
import DescentController from './DescentController';
import SurfaceWorld from './SurfaceWorld';

// Altura proporcional al radio (no un offset fijo) para que la vista inicial siempre
// muestre la curvatura del planeta sin importar qué tan grande sea RADIUS_SCALE.
const SHIP_START: [number, number, number] = [
  PLANETS.earth.position[0],
  PLANETS.earth.position[1] + PLANETS.earth.radius * 1.03,
  PLANETS.earth.position[2] + PLANETS.earth.radius * 0.07,
];

export default function SceneRoot() {
  const phase = useGameStore((s) => s.phase);
  const flightMode = useGameStore((s) => s.flightMode);
  const shipRef = useRef<Group>(null);
  const cameraLookRef = useRef(new Quaternion());

  // Desfasadas a propósito respecto a 'entering'/'exiting': el mundo viejo se mantiene
  // montado mientras el destello aparece encima, y el nuevo se mantiene montado mientras
  // el destello desaparece encima del nuevo — así nunca hay un frame de vacío antes de
  // que el destello llegue a tapar la pantalla del todo. Ver docs/GAME_DESIGN.md.
  const showSpace = flightMode === 'space' || flightMode === 'entering';
  const showSurface =
    flightMode === 'descending' ||
    flightMode === 'landed' ||
    flightMode === 'ascending' ||
    flightMode === 'exiting';

  return (
    <>
      {showSpace && (
        <>
          <ambientLight intensity={0.25} />
          <directionalLight position={SUN.position} intensity={2} />
          <Starfield />
          <Sun />
          <Earth />
          <Mars />
          <Mercury />
          <Venus />
        </>
      )}
      {showSurface && <SurfaceWorld />}
      <Ship ref={shipRef} position={SHIP_START} />
      {/* Montado también durante 'entering' (no solo 'space'): así sigue integrando la
          última velocidad conocida mientras el destello recién empieza a aparecer, en vez
          de clavarse en seco — ver el branch de 'entering' adentro del propio archivo. */}
      {phase === 'flight' && (flightMode === 'space' || flightMode === 'entering') && (
        <FlightController shipRef={shipRef} cameraLookRef={cameraLookRef} />
      )}
      {/* Sin el gate de phase==='flight': tiene que estar montado desde el arranque
          (arrancamos 'landed' en la Tierra durante el briefing, phase='briefing' todavía)
          para que su efecto de montaje pare a la nave en el piso desde el primer frame,
          no recién cuando el jugador hace click en despegar. También montado durante
          'exiting' por la misma razón que 'entering' arriba: seguir con la última
          velocidad vertical mientras el destello recién empieza. */}
      {(flightMode === 'descending' ||
        flightMode === 'landed' ||
        flightMode === 'ascending' ||
        flightMode === 'exiting') && <DescentController shipRef={shipRef} cameraLookRef={cameraLookRef} />}
      <CameraRig shipRef={shipRef} cameraLookRef={cameraLookRef} />
    </>
  );
}
