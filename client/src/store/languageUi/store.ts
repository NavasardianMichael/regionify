import { create } from 'zustand';

type LanguageUiState = {
  isLanguageTransitioning: boolean;
  setLanguageTransitioning: (value: boolean) => void;
};

export const useLanguageUiStore = create<LanguageUiState>((set) => ({
  isLanguageTransitioning: false,
  setLanguageTransitioning: (value) => set({ isLanguageTransitioning: value }),
}));
