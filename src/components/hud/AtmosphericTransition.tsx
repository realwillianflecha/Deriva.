'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/state/gameStore';
import {
  ATMOSPHERIC_FLASH_FADE_IN_MS,
  ATMOSPHERIC_FLASH_HOLD_MS,
  ATMOSPHERIC_FLASH_FADE_OUT_MS,
} from '@/lib/constants';

const totalMs = ATMOSPHERIC_FLASH_FADE_IN_MS + ATMOSPHERIC_FLASH_HOLD_MS + ATMOSPHERIC_FLASH_FADE_OUT_MS;
const swapAtMs = ATMOSPHERIC_FLASH_FADE_IN_MS + ATMOSPHERIC_FLASH_HOLD_MS;
const times = [
  0,
  ATMOSPHERIC_FLASH_FADE_IN_MS / totalMs,
  swapAtMs / totalMs,
  1,
];

/**
 * Destello blanco que tapa el cambio de mundo espacio<->superficie — nunca una pantalla
 * de carga con spinner. El swap de estado real (arriveAtSurface/returnToSpace) pasa en el
 * punto medio, cuando la pantalla está 100% blanca, así el cambio de escena es invisible.
 * También el primer sonido del proyecto: un "whoosh" real de reentrada (Mixkit, licencia
 * gratuita sin atribución requerida).
 */
export default function AtmosphericTransition() {
  const flightMode = useGameStore((s) => s.flightMode);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (flightMode !== 'entering' && flightMode !== 'exiting') return;

    const audio = new Audio('/audio/atmospheric-entry.mp3');
    audio.volume = 0.7;
    audioRef.current = audio;
    audio.play().catch(() => {});

    const timer = setTimeout(() => {
      if (flightMode === 'entering') {
        useGameStore.getState().arriveAtSurface();
      } else {
        useGameStore.getState().returnToSpace();
      }
    }, swapAtMs);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audioRef.current = null;
    };
  }, [flightMode]);

  if (flightMode !== 'entering' && flightMode !== 'exiting') return null;

  return (
    <motion.div
      key={flightMode}
      className="pointer-events-none absolute inset-0 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: totalMs / 1000, times, ease: 'easeInOut' }}
    />
  );
}
