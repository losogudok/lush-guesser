import { useStore } from 'zustand';

import { createGameStore, type GameStore } from './gameStore';

// One in-memory Game Session per running SPA; closing it discards the session.
const gameStore = createGameStore();

export const useGameStore = <T>(selector: (state: GameStore) => T): T =>
  useStore(gameStore, selector);
