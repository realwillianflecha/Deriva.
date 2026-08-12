'use client';

import { useGameStore } from '@/state/gameStore';
import { useUiStore } from '@/state/uiStore';
import { requestFlightPointerLock } from '@/lib/canvasRegistry';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';

export default function PointerLockPrompt() {
  const phase = useGameStore((s) => s.phase);
  const flightMode = useGameStore((s) => s.flightMode);
  const narrativeVisible = useGameStore((s) => s.narrativeVisible);
  const pointerLocked = useUiStore((s) => s.pointerLocked);

  if (phase !== 'flight' || narrativeVisible || pointerLocked) return null;

  const onFoot = flightMode === 'onfoot';

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Panel className="pointer-events-auto p-5 text-center">
        <p className="mb-3 text-sm text-white/80">
          {onFoot ? 'Los controles a pie están en pausa.' : 'Los controles de vuelo están en pausa.'}
        </p>
        <Button onClick={() => requestFlightPointerLock()}>{onFoot ? 'Click para caminar' : 'Click para volar'}</Button>
      </Panel>
    </div>
  );
}
