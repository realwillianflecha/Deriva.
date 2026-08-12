'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/state/gameStore';
import { SPACE_FACTS } from '@/content/facts/spaceFacts';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';

export default function MissionLog() {
  const phase = useGameStore((s) => s.phase);
  const missionFlags = useGameStore((s) => s.missionFlags);
  const landingSite = useGameStore((s) => s.landingSite);
  const unlockedFacts = useGameStore((s) => s.unlockedFacts);
  const flightSummary = useGameStore((s) => s.flightSummary);
  const resetGame = useGameStore((s) => s.resetGame);

  if (phase !== 'debrief') return null;

  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl"
      >
        <Panel className="max-h-[85vh] overflow-y-auto p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
            Misión completa
          </p>
          <h2 className="mb-4 text-xl font-bold text-white">Informe de la misión</h2>

          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-white/50">Combustible extra</p>
              <p className="font-medium text-white">{missionFlags.extraFuel ? 'Sí' : 'No'}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-white/50">Ante la llamarada</p>
              <p className="font-medium text-white">
                {missionFlags.usedShields === undefined
                  ? '—'
                  : missionFlags.usedShields
                  ? 'Escudos arriba'
                  : 'Siguió escaneando'}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-white/50">Sitio elegido</p>
              <p className="font-medium text-white">
                {landingSite === 'jezero' ? 'Cráter Jezero' : landingSite === 'olympus' ? 'Olympus Mons' : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-white/50">Impulso (boost) usado</p>
              <p className="font-medium text-white">{flightSummary?.boostUsed ? 'Sí' : 'No'}</p>
            </div>
          </div>

          {flightSummary && (
            <div className="mb-4 space-y-1 rounded-lg bg-white/5 p-3 text-sm text-white/80">
              <p>🚀 Velocidad máxima: {flightSummary.topSpeed.toFixed(0)} u/s.</p>
              <p>
                ⏱ Tiempo de vuelo: {Math.round(flightSummary.travelTimeSeconds)}s · Combustible
                restante: {flightSummary.fuelRemainingPercent.toFixed(0)}%.
              </p>
            </div>
          )}

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Datos recolectados
          </p>
          <div className="mb-5 space-y-2">
            {unlockedFacts.map((factId) => {
              const fact = SPACE_FACTS[factId];
              if (!fact) return null;
              return (
                <div key={factId} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-medium text-sky-300">{fact.title}</p>
                  <p className="text-xs leading-relaxed text-white/70">{fact.text}</p>
                </div>
              );
            })}
          </div>

          <Button onClick={resetGame}>Volar de nuevo</Button>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-white/30">
            Texturas planetarias: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0. Modelo de
            nave: &quot;SpaceX Falcon Heavy&quot; por Carwyn Pelley (poly.pizza), CC BY 3.0. Texturas de
            terreno: ambientCG.com (Grass004, Ground054, Rock026), CC0. Sonido de reentrada: Mixkit.
          </p>
        </Panel>
      </motion.div>
    </div>
  );
}
