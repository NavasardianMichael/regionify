import type { ProfileState } from './types';

// State selectors
export const selectUser = (state: ProfileState) => state.user;
export const selectIsLoggedIn = (state: ProfileState) => state.isLoggedIn;
export const selectIsLoading = (state: ProfileState) => state.isLoading;

// Action selectors
export const selectSetUser = (state: ProfileState) => state.setUser;
export const selectSetLoading = (state: ProfileState) => state.setLoading;
export const selectLogout = (state: ProfileState) => state.logout;
