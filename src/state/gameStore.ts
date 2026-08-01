import { create } from 'zustand';
import { NARRATIVE_NODES } from '@/content/narrative/nodes';
import { FUEL_MAX } from '@/lib/constants';
import type { FlightSummary, GamePhase, HeadingScreen, LandingSiteId } from './types';

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

  selectChoice: (choiceId: string) => void;
  updateNav: (data: Partial<{
    fuel: number;
    velocityMagnitude: number;
    distanceToMars: number;
    travelProgress: number;
    headingScreen: HeadingScreen;
  }>) => void;
  triggerFlare: () => void;
  completeFlight: (summary: FlightSummary) => void;
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
      });
    } else if (choice.action === 'resume-flight') {
      set({ ...base, narrativeVisible: false });
    } else if (choice.action === 'complete-mission') {
      set({ ...base, phase: 'debrief' });
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

  resetGame: () => set({ ...initialState }),
}));
