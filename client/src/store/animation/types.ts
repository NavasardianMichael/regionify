export type TransitionType = 'smooth' | 'instant';

export type AnimationState = {
  // State
  isPlaying: boolean;
  speed: number;
  transitionType: TransitionType;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setTransitionType: (type: TransitionType) => void;
  reset: () => void;
};
