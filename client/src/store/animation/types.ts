export type TransitionType = 'smooth' | 'instant';

/** Linear 0–1 along preview blend; MapViewer applies smoothstep when sampling colors. */
export type PlaybackPreviewBlend = {
  fromPeriod: string;
  toPeriod: string;
  t: number;
};

export type AnimationState = {
  // State
  isPlaying: boolean;
  /** Seconds to show each time period in preview (default 2). Independent of smooth transition. */
  secondsPerPeriod: number;
  transitionType: TransitionType;
  /** Smooth preview: interpolate colors between two periods (null when idle or instant mode). */
  playbackPreviewBlend: PlaybackPreviewBlend | null;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSecondsPerPeriod: (seconds: number) => void;
  setTransitionType: (type: TransitionType) => void;
  setPlaybackPreviewBlend: (blend: PlaybackPreviewBlend | null) => void;
  reset: () => void;
};
