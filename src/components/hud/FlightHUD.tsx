'use client';

import { useGameStore } from '@/state/gameStore';
import Panel from '@/components/ui/Panel';
import Gauge from '@/components/ui/Gauge';
import { SHIP_BOOST_MAX_SPEED } from '@/lib/constants';

export default function FlightHUD() {
  const phase = useGameStore((s) => s.phase);
  const flightMode = useGameStore((s) => s.flightMode);
  const velocityMagnitude = useGameStore((s) => s.velocityMagnitude);
  const fuel = useGameStore((s) => s.fuel);
  const distanceToMars = useGameStore((s) => s.distanceToMars);
  const missionFlags = useGameStore((s) => s.missionFlags);

  if (phase !== 'flight' || flightMode !== 'space') return null;

  const fuelMax = missionFlags.extraFuel ? 125 : 100;

  return (
    <div className="pointer-events-none absolute left-4 top-4 w-56 sm:left-8 sm:top-8">
      <Panel className="space-y-3 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
          Vuelo libre
        </p>
        <Gauge label="Velocidad" value={velocityMagnitude} max={SHIP_BOOST_MAX_SPEED} unit=" u/s" />
        <Gauge label="Combustible" value={fuel} max={fuelMax} unit="%" danger={fuel < 20} />
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
          <span>Distancia a Marte</span>
          <span className="text-white/80">{Math.round(distanceToMars)} u</span>
        </div>
      </Panel>
      <p className="pointer-events-none mt-3 text-[11px] text-white/45">
        Mouse: apuntar · WASD: mover · Espacio/Ctrl: subir/bajar · Shift: impulso · C: cámara
      </p>
    </div>
  );
}
