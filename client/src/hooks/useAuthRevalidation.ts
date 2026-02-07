import { useEffect } from 'react';

import { getAuthStatus } from '@/api/auth/status';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';

/**
 * Revalidates auth status on app load by calling GET /auth/status.
 * If the server session is valid, refreshes local user data.
 * If not, clears the persisted profile so the UI reflects logged-out state.
 */
export function useAuthRevalidation(): void {
  const setUser = useProfileStore(selectSetUser);

  useEffect(() => {
    const revalidate = async () => {
      try {
        const { authenticated, user } = await getAuthStatus();

        if (authenticated && user) {
          setUser(user);
        } else {
          setUser(null);
        }
      } catch {
        // Network error — keep the cached state, don't log the user out
      }
    };

    void revalidate();
  }, [setUser]);
}
