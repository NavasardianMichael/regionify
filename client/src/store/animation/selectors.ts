import type { AnimationState } from './types';

// State selectors
export const selectIsPlaying = (state: AnimationState) => state.isPlaying;
export const selectSecondsPerPeriod = (state: AnimationState) => state.secondsPerPeriod;
export const selectTransitionType = (state: AnimationState) => state.transitionType;
export const selectPlaybackPreviewBlend = (state: AnimationState) => state.playbackPreviewBlend;

// Action selectors
export const selectPlay = (state: AnimationState) => state.play;
export const selectPause = (state: AnimationState) => state.pause;
export const selectTogglePlay = (state: AnimationState) => state.togglePlay;
export const selectSetSecondsPerPeriod = (state: AnimationState) => state.setSecondsPerPeriod;
export const selectSetTransitionType = (state: AnimationState) => state.setTransitionType;
export const selectReset = (state: AnimationState) => state.reset;
