'use client';

import { useGameStore } from '@/state/gameStore';
import Panel from '@/components/ui/Panel';
import Gauge from '@/components/ui/Gauge';
import { DESCENT_START_ALTITUDE } from '@/lib/constants';

const HINT_BY_MODE: Record<string, string> = {
  descending: 'Mantené ESPACIO para frenar la caída',
  landed: 'Aterrizaste — mantené ESPACIO para despegar de nuevo',
  ascending: 'Despegando — mantené ESPACIO para ganar altura',
};

export default function DescentHUD() {
  const phase = useGameStore((s) => s.phase);
  const flightMode = useGameStore((s) => s.flightMode);
  const altitude = useGameStore((s) => s.altitude);
  const verticalSpeed = useGameStore((s) => s.verticalSpeed);

  // phase==='flight' evita que se muestre durante el briefing inicial (arrancamos
  // 'landed' en la Tierra, pero todavía no despegamos) ni durante el debrief.
  if (phase !== 'flight') return null;
  if (flightMode !== 'descending' && flightMode !== 'landed' && flightMode !== 'ascending') return null;

  return (
    <div className="pointer-events-none absolute left-4 top-4 w-56 sm:left-8 sm:top-8">
      <Panel className="space-y-3 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
          {flightMode === 'landed' ? 'En superficie' : 'Descenso'}
        </p>
        <Gauge label="Altitud" value={altitude} max={DESCENT_START_ALTITUDE} unit=" m" />
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
          <span>Velocidad vertical</span>
          <span className={verticalSpeed < -30 ? 'text-red-400' : 'text-white/80'}>
            {verticalSpeed.toFixed(1)} m/s
          </span>
        </div>
      </Panel>
      <p className="pointer-events-none mt-3 text-[11px] text-white/45">{HINT_BY_MODE[flightMode]}</p>
    </div>
  );
}
