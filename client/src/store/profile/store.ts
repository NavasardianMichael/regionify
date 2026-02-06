import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileState } from './types';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,

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
    }),
    {
      name: 'regionify-profile',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);
