export type TransitionType = 'smooth' | 'instant';

export type AnimationState = {
  // State
  isPlaying: boolean;
  /** Seconds to show each time period in preview (default 2). Independent of smooth transition. */
  secondsPerPeriod: number;
  transitionType: TransitionType;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSecondsPerPeriod: (seconds: number) => void;
  setTransitionType: (type: TransitionType) => void;
  reset: () => void;
};
