import { createStore } from 'zustand/vanilla';

import type { Product } from '../data/products';
import {
  advanceRound,
  createGameSession,
  revealNextIngredientClue,
  submitGuess,
  type GameSession,
  type RandomSource,
} from './gameSession';

export interface GameStore {
  session: GameSession | null;
  start: (products: readonly Product[]) => void;
  revealNextClue: () => void;
  guess: (productId: string) => boolean | null;
  nextRound: () => void;
  reset: () => void;
}

export const createGameStore = (random: RandomSource = Math.random) =>
  createStore<GameStore>()((set, get) => {
    const updateSession = (
      transition: (session: GameSession) => GameSession,
    ): GameSession | null => {
      const current = get().session;
      if (!current) return null;

      const next = transition(current);
      if (next === current) return null;

      set({ session: next });
      return next;
    };

    return {
      session: null,
      start: (products) => set({ session: createGameSession(products, random) }),
      revealNextClue: () => {
        updateSession(revealNextIngredientClue);
      },
      // null means the guess was ignored; the UI should not replay feedback.
      guess: (productId) =>
        updateSession((session) => submitGuess(session, productId))?.guessCorrect ?? null,
      nextRound: () => {
        updateSession(advanceRound);
      },
      reset: () => set({ session: null }),
    };
  });
