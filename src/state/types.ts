export type PlanetId = 'earth' | 'mars' | 'mercury' | 'venus';

export type GamePhase = 'briefing' | 'flight' | 'debrief';

export type LandingSiteId = 'jezero' | 'olympus';

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
  action?: 'start-flight' | 'resume-flight' | 'complete-mission';
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
