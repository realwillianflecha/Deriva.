'use client';

import dynamic from 'next/dynamic';
import HUD from '@/components/hud/HUD';

const GameCanvas = dynamic(() => import('@/components/scene/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-white/50">
      Cargando simulador...
    </div>
  ),
});

export default function GameShell() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <GameCanvas />
      <HUD />
    </div>
  );
}
