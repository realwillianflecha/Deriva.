'use client';

import DecisionPanel from './DecisionPanel';
import FlightHUD from './FlightHUD';
import TravelProgressBar from './TravelProgressBar';
import TargetCompass from './TargetCompass';
import MissionLog from './MissionLog';
import PointerLockPrompt from './PointerLockPrompt';
import PointerLockManager from './PointerLockManager';

export default function HUD() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <PointerLockManager />
      <FlightHUD />
      <TravelProgressBar />
      <TargetCompass />
      <PointerLockPrompt />
      <DecisionPanel />
      <MissionLog />
    </div>
  );
}
