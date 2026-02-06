import type { UserPublic } from '@regionify/shared';

export type ProfileState = {
  // State
  user: UserPublic | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: UserPublic | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
};
