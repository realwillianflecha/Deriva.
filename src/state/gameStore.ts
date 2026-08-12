import { create } from 'zustand';
import { NARRATIVE_NODES } from '@/content/narrative/nodes';
import { FUEL_MAX } from '@/lib/constants';
import type { FlightMode, FlightSummary, GamePhase, HeadingScreen, LandingSiteId, PlanetId } from './types';

interface GameState {
  phase: GamePhase;
  currentNodeId: string;
  narrativeVisible: boolean;
  choiceHistory: { nodeId: string; choiceId: string }[];
  unlockedFacts: string[];
  missionFlags: Record<string, boolean>;
  landingSite: LandingSiteId | null;

  fuel: number;
  velocityMagnitude: number;
  distanceToMars: number;
  travelProgress: number;
  headingScreen: HeadingScreen;

  flightSummary: FlightSummary | null;

  flightMode: FlightMode;
  surfacePlanetId: PlanetId | null;
  altitude: number;
  verticalSpeed: number;
  nearShip: boolean;

  selectChoice: (choiceId: string) => void;
  updateNav: (data: Partial<{
    fuel: number;
    velocityMagnitude: number;
    distanceToMars: number;
    travelProgress: number;
    headingScreen: HeadingScreen;
    altitude: number;
    verticalSpeed: number;
    nearShip: boolean;
  }>) => void;
  triggerFlare: () => void;
  completeFlight: (summary: FlightSummary) => void;
  beginDescent: (planetId: PlanetId) => void;
  arriveAtSurface: () => void;
  touchdown: () => void;
  beginAscent: () => void;
  beginExit: () => void;
  returnToSpace: () => void;
  exitShip: () => void;
  enterShip: () => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'briefing' as GamePhase,
  currentNodeId: 'briefing-intro',
  narrativeVisible: true,
  choiceHistory: [] as { nodeId: string; choiceId: string }[],
  unlockedFacts: [] as string[],
  missionFlags: {} as Record<string, boolean>,
  landingSite: null as LandingSiteId | null,

  fuel: FUEL_MAX,
  velocityMagnitude: 0,
  distanceToMars: 0,
  travelProgress: 0,
  headingScreen: { onScreen: true, angle: 0 } as HeadingScreen,

  flightSummary: null as FlightSummary | null,

  // Se arranca parados en la Tierra, no flotando en el espacio -- despegar (acción
  // 'start-flight') es lo que dispara la secuencia de ascenso hacia el espacio.
  flightMode: 'landed' as FlightMode,
  surfacePlanetId: 'earth' as PlanetId | null,
  altitude: 0,
  verticalSpeed: 0,
  nearShip: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  selectChoice: (choiceId) => {
    const state = get();
    const node = NARRATIVE_NODES[state.currentNodeId];
    const choice = node?.choices.find((c) => c.id === choiceId);
    if (!node || !choice) return;

    const missionFlags = choice.setFlags ? { ...state.missionFlags, ...choice.setFlags } : state.missionFlags;
    const landingSite = choice.setSite ?? state.landingSite;

    let unlockedFacts = state.unlockedFacts;
    const nextNode = choice.next ? NARRATIVE_NODES[choice.next] : undefined;
    for (const factId of [choice.factId, nextNode?.factId]) {
      if (factId && !unlockedFacts.includes(factId)) {
        unlockedFacts = [...unlockedFacts, factId];
      }
    }

    const base = {
      choiceHistory: [...state.choiceHistory, { nodeId: node.id, choiceId }],
      missionFlags,
      landingSite,
      unlockedFacts,
      currentNodeId: choice.next || state.currentNodeId,
    };

    if (choice.action === 'start-flight') {
      set({
        ...base,
        phase: 'flight',
        narrativeVisible: false,
        fuel: missionFlags.extraFuel ? FUEL_MAX * 1.25 : FUEL_MAX,
        // Arranca 'landed' (no 'ascending' directo): con el modo a pie ya sumado, este
        // click ya no es automáticamente "la decisión de despegar" — el jugador recién
        // ahora tiene control activo y puede elegir bajarse a caminar (E) o mantener
        // Espacio para despegar, exactamente igual que en cualquier otro aterrizaje.
        flightMode: 'landed',
      });
    } else if (choice.action === 'resume-flight') {
      set({ ...base, narrativeVisible: false });
    } else if (choice.action === 'begin-descent') {
      // narrativeVisible:false es necesario acá — si no, PointerLockManager fuerza
      // exitPointerLock() en cada cambio de store durante todo el descenso (lee
      // narrativeVisible || phase!=='flight', y phase se mantiene 'flight' a propósito
      // hasta que la nave toca tierra).
      set({ ...base, narrativeVisible: false, flightMode: 'entering', surfacePlanetId: 'mars' });
    } else {
      set({ ...base, narrativeVisible: true });
    }
  },

  updateNav: (data) => set(data),

  triggerFlare: () =>
    set({ currentNodeId: 'transit-flare', narrativeVisible: true }),

  completeFlight: (summary) =>
    set({
      flightSummary: summary,
      currentNodeId: 'landing-brief',
      narrativeVisible: true,
    }),

  beginDescent: (planetId) => set({ flightMode: 'entering', surfacePlanetId: planetId }),

  arriveAtSurface: () => set({ flightMode: 'descending' }),

  touchdown: () =>
    set((state) => ({
      flightMode: 'landed',
      ...(state.surfacePlanetId === 'mars' ? { phase: 'debrief' as GamePhase } : {}),
    })),

  beginAscent: () => set({ flightMode: 'ascending' }),

  beginExit: () => set({ flightMode: 'exiting' }),

  // surfacePlanetId queda seteado a propósito -- FlightController lo necesita al montar
  // de nuevo para saber sobre qué planeta reposicionar la nave, y lo limpia él mismo.
  returnToSpace: () => set({ flightMode: 'space' }),

  exitShip: () => set({ flightMode: 'onfoot' }),
  enterShip: () => set({ flightMode: 'landed' }),

  resetGame: () => set({ ...initialState }),
}));
