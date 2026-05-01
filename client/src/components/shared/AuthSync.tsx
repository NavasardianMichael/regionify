import { useEffect } from 'react';
import { getMe } from '@/api/auth';
import { selectIsLoggedIn, selectLogout, selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { isEmbedPathname } from '@/constants/routes';

/**
 * Keeps the persisted auth state (Zustand + localStorage) in sync with the server session.
 * Always tries GET /auth/me on the client app (except embed routes): a valid session cookie can
 * exist without hydrated profile state (cleared storage, automation, or persist race). Guests
 * get 401 — ignored. If we had a persisted user but the session is gone, we clear local state.
 */
export const AuthSync = () => {
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const setUser = useProfileStore(selectSetUser);
  const logout = useProfileStore(selectLogout);

  useEffect(() => {
    if (isEmbedPathname(window.location.pathname)) return;

    let cancelled = false;

    const sync = async () => {
      try {
        const { user } = await getMe();
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        if (!cancelled && useProfileStore.getState().user !== null) {
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
