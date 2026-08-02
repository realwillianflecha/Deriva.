'use client';

import DecisionPanel from './DecisionPanel';
import FlightHUD from './FlightHUD';
import DescentHUD from './DescentHUD';
import TravelProgressBar from './TravelProgressBar';
import TargetCompass from './TargetCompass';
import PointerLockPrompt from './PointerLockPrompt';
import PointerLockManager from './PointerLockManager';
import AtmosphericTransition from './AtmosphericTransition';

// MissionLog (el panel de fin de misión con los datos del vuelo) está deliberadamente
// deshabilitado a pedido del usuario -- "molesta". El componente sigue entero en
// MissionLog.tsx, solo no se monta acá. Sacar este comentario y volver a importar/montar
// <MissionLog /> para reactivarlo.

export default function HUD() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <PointerLockManager />
      <FlightHUD />
      <DescentHUD />
      <TravelProgressBar />
      <TargetCompass />
      <PointerLockPrompt />
      <DecisionPanel />
      <AtmosphericTransition />
    </div>
  );
}
