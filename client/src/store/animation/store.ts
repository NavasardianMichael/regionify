import { create } from 'zustand';
import type { AnimationState } from './types';

const DEFAULT_SECONDS_PER_PERIOD = 2;

export const useAnimationStore = create<AnimationState>((set) => ({
  isPlaying: false,
  secondsPerPeriod: DEFAULT_SECONDS_PER_PERIOD,
  transitionType: 'smooth',

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSecondsPerPeriod: (secondsPerPeriod) => set({ secondsPerPeriod }),
  setTransitionType: (transitionType) => set({ transitionType }),
  reset: () =>
    set({
      isPlaying: false,
      secondsPerPeriod: DEFAULT_SECONDS_PER_PERIOD,
      transitionType: 'smooth',
    }),
}));
