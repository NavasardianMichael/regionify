import { create } from 'zustand';

import type { AnimationState } from './types';

export const useAnimationStore = create<AnimationState>((set) => ({
  isPlaying: false,
  speed: 1,
  transitionType: 'smooth',

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setTransitionType: (transitionType) => set({ transitionType }),
  reset: () => set({ isPlaying: false, speed: 1, transitionType: 'smooth' }),
}));
