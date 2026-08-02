'use client';

import { useGameStore } from '@/state/gameStore';

export default function TargetCompass() {
  const phase = useGameStore((s) => s.phase);
  const flightMode = useGameStore((s) => s.flightMode);
  const headingScreen = useGameStore((s) => s.headingScreen);

  if (phase !== 'flight' || flightMode !== 'space' || headingScreen.onScreen) return null;

  const radius = 260;
  const x = Math.cos(headingScreen.angle) * radius;
  const y = Math.sin(headingScreen.angle) * radius;
  const arrowRotationDeg = (headingScreen.angle * 180) / Math.PI;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
      <div
        className="absolute flex flex-col items-center gap-1"
        style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
      >
        <div
          className="text-lg text-sky-300"
          style={{ transform: `rotate(${arrowRotationDeg}deg)` }}
        >
          ➤
        </div>
        <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-sky-200">
          Marte
        </span>
      </div>
    </div>
  );
}
