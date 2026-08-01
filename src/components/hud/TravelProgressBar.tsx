'use client';

import { useGameStore } from '@/state/gameStore';
import Panel from '@/components/ui/Panel';

export default function TravelProgressBar() {
  const phase = useGameStore((s) => s.phase);
  const travelProgress = useGameStore((s) => s.travelProgress);
  const narrativeVisible = useGameStore((s) => s.narrativeVisible);

  if (phase !== 'flight') return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 w-72 -translate-x-1/2 sm:top-8">
      <Panel className="p-3">
        <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
          <span>Tierra</span>
          <span>{narrativeVisible ? 'En pausa' : 'Rumbo a Marte'}</span>
          <span>Marte</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-sky-400 transition-[width] duration-150"
            style={{ width: `${travelProgress * 100}%` }}
          />
        </div>
      </Panel>
    </div>
  );
}
