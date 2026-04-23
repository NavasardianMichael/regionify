import { create } from 'zustand';
import type { AnimationState } from './types';

const DEFAULT_SECONDS_PER_PERIOD = 1;

export const useAnimationStore = create<AnimationState>((set) => ({
  isPlaying: false,
  secondsPerPeriod: DEFAULT_SECONDS_PER_PERIOD,
  transitionType: 'smooth',
  playbackPreviewBlend: null,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false, playbackPreviewBlend: null }),
  togglePlay: () =>
    set((state) => {
      const nextPlaying = !state.isPlaying;
      return {
        isPlaying: nextPlaying,
        ...(nextPlaying ? {} : { playbackPreviewBlend: null }),
      };
    }),
  setSecondsPerPeriod: (secondsPerPeriod) => set({ secondsPerPeriod }),
  setTransitionType: (transitionType) => set({ transitionType }),
  setPlaybackPreviewBlend: (playbackPreviewBlend) => set({ playbackPreviewBlend }),
  reset: () =>
    set({
      isPlaying: false,
      secondsPerPeriod: DEFAULT_SECONDS_PER_PERIOD,
      transitionType: 'smooth',
      playbackPreviewBlend: null,
    }),
}));
