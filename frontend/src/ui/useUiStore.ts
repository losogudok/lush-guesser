import { useStore } from 'zustand';

import { createUiStore, type UiStore } from './uiStore';

const uiStore = createUiStore();

export const useUiStore = <T>(selector: (state: UiStore) => T): T =>
  useStore(uiStore, selector);
