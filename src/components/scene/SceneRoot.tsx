'use client';

import { useRef } from 'react';
import type { Group } from 'three';
import { useGameStore } from '@/state/gameStore';
import { PLANETS, SUN } from '@/content/planets/planetData';
import Starfield from './Starfield';
import Earth from './bodies/Earth';
import Mars from './bodies/Mars';
import Sun from './bodies/Sun';
import Ship from './Ship';
import CameraRig from './CameraRig';
import FlightController from './FlightController';

const SHIP_START: [number, number, number] = [
  PLANETS.earth.position[0],
  PLANETS.earth.position[1] + PLANETS.earth.radius + 4,
  PLANETS.earth.position[2] + 10,
];

export default function SceneRoot() {
  const phase = useGameStore((s) => s.phase);
  const shipRef = useRef<Group>(null);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={SUN.position} intensity={2} />
      <Starfield />
      <Sun />
      <Earth />
      <Mars />
      <Ship ref={shipRef} position={SHIP_START} />
      {phase === 'flight' && <FlightController shipRef={shipRef} />}
      <CameraRig shipRef={shipRef} />
    </>
  );
}
