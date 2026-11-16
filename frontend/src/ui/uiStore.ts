import { createStore } from 'zustand/vanilla';

export type Screen = 'welcome' | 'game' | 'leaderboard';
export type InfoModalType = 'help' | 'terms' | 'privacy' | 'contact';

export interface UiStore {
  screen: Screen;
  infoModal: InfoModalType | null;
  navigate: (screen: Screen) => void;
  openInfo: (type: InfoModalType) => void;
  closeInfo: () => void;
}

export const createUiStore = () =>
  createStore<UiStore>()((set) => ({
    screen: 'welcome',
    infoModal: null,
    navigate: (screen) => set({ screen, infoModal: null }),
    openInfo: (infoModal) => set({ infoModal }),
    closeInfo: () => set({ infoModal: null }),
  }));
