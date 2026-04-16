import { useEffect } from 'react';
import { getMe } from '@/api/auth';
import { selectIsLoggedIn, selectLogout, selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { isEmbedPathname } from '@/constants/routes';

/**
 * Keeps the persisted auth state (Zustand + localStorage) in sync with the server session.
 * If we think the user is logged in but /auth/me fails (e.g. expired cookie),
 * we clear the local profile state so UI and API expectations match.
 */
export const AuthSync = () => {
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const setUser = useProfileStore(selectSetUser);
  const logout = useProfileStore(selectLogout);

  useEffect(() => {
    if (!isLoggedIn || isEmbedPathname(window.location.pathname)) return;

    let cancelled = false;

    const sync = async () => {
      try {
        const { user } = await getMe();
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      }
    };

    void sync();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, setUser, logout]);

  return null;
};
