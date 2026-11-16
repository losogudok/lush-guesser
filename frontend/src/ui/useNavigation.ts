import { useCallback } from 'react';

import { productCatalog } from '../data/products';
import { useGameStore } from '../game/useGameStore';
import type { Screen } from './uiStore';
import { useUiStore } from './useUiStore';

// Keep screen changes and the Game Session lifecycle in one place.
export const useNavigation = () => {
  const navigate = useUiStore((state) => state.navigate);
  const startGame = useGameStore((state) => state.start);
  const resetGame = useGameStore((state) => state.reset);

  return useCallback((screen: Screen) => {
    if (screen === 'game') {
      startGame(productCatalog.products);
    } else {
      resetGame();
    }
    navigate(screen);
  }, [navigate, startGame, resetGame]);
};
