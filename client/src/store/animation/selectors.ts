import type { AnimationState } from './types';

// State selectors
export const selectIsPlaying = (state: AnimationState) => state.isPlaying;
export const selectSpeed = (state: AnimationState) => state.speed;
export const selectTransitionType = (state: AnimationState) => state.transitionType;

// Action selectors
export const selectPlay = (state: AnimationState) => state.play;
export const selectPause = (state: AnimationState) => state.pause;
export const selectTogglePlay = (state: AnimationState) => state.togglePlay;
export const selectSetSpeed = (state: AnimationState) => state.setSpeed;
export const selectSetTransitionType = (state: AnimationState) => state.setTransitionType;
export const selectReset = (state: AnimationState) => state.reset;
