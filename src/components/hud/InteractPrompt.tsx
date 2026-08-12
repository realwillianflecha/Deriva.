'use client';

import { useGameStore } from '@/state/gameStore';

export default function InteractPrompt() {
  const phase = useGameStore((s) => s.phase);
  const flightMode = useGameStore((s) => s.flightMode);
  const nearShip = useGameStore((s) => s.nearShip);

  if (phase !== 'flight') return null;

  let text: string | null = null;
  if (flightMode === 'landed') text = 'Presioná E para bajar de la nave';
  else if (flightMode === 'onfoot' && nearShip) text = 'Presioná E para subir a la nave';

  if (!text) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center sm:bottom-28">
      <div className="rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white/85 backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}
