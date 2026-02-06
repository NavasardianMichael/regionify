import { create } from 'zustand';

import type { ProfileState } from './types';

export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isLoggedIn: user !== null,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      isLoggedIn: false,
      isLoading: false,
    }),
}));
