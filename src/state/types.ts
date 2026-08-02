export type PlanetId = 'earth' | 'mars' | 'mercury' | 'venus';

export type GamePhase = 'briefing' | 'flight' | 'debrief';

export type LandingSiteId = 'jezero' | 'olympus';

/**
 * Eje de estado independiente de `GamePhase` (mismo patrón que `narrativeVisible`, que ya
 * se superpone a `phase` sin tocarlo). `phase` sigue valiendo 'flight' durante toda esta
 * secuencia — esto solo describe qué sub-sistema de vuelo está activo.
 */
export type FlightMode = 'space' | 'entering' | 'descending' | 'landed' | 'ascending' | 'exiting';

export interface FlightSummary {
  fuelRemainingPercent: number;
  topSpeed: number;
  travelTimeSeconds: number;
  boostUsed: boolean;
}

export interface NarrativeChoice {
  id: string;
  label: string;
  next: string;
  setFlags?: Record<string, boolean>;
  setSite?: LandingSiteId;
  factId?: string;
  action?: 'start-flight' | 'resume-flight' | 'begin-descent';
}

export interface NarrativeNode {
  id: string;
  speaker?: string;
  text: string;
  factId?: string;
  choices: NarrativeChoice[];
}

export interface SpaceFact {
  id: string;
  title: string;
  text: string;
}

export interface PlanetData {
  id: PlanetId;
  name: string;
  color: string;
  radius: number;
  gravity: number;
  position: [number, number, number];
  textureMap: string;
  cloudsMap?: string;
}

export interface SunData {
  radius: number;
  position: [number, number, number];
  textureMap: string;
}

export interface HeadingScreen {
  onScreen: boolean;
  angle: number;
}
