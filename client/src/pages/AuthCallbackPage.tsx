import { type FC, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import type { UserPublic } from '@/api/auth/types';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { applyFullTemporaryProjectState } from '@/helpers/applyFullTemporaryProjectState';
import {
  clearReturnUrl,
  clearTemporaryProjectState,
  getReturnUrl,
  getTemporaryProjectState,
  mergeTemporaryStateWithDefaults,
  setSkipNewProjectResetOnce,
} from '@/helpers/temporaryProjectState';

const AuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useProfileStore(selectSetUser);

  useEffect(() => {
    const userParam = searchParams.get('user');

    if (userParam) {
      try {
        const user = JSON.parse(atob(userParam)) as UserPublic;
        setUser(user);

        const pendingReturnUrl = getReturnUrl();
        const partial = getTemporaryProjectState();
        const hadGuestDraft = Boolean(partial && Object.keys(partial).length > 0);

        if (hadGuestDraft && partial) {
          const merged = mergeTemporaryStateWithDefaults(partial);
          applyFullTemporaryProjectState(merged);
          clearTemporaryProjectState();

          if (pendingReturnUrl) {
            clearReturnUrl();
            if (
              pendingReturnUrl === ROUTES.PROJECT_NEW ||
              pendingReturnUrl.startsWith(`${ROUTES.PROJECT_NEW}?`)
            ) {
              setSkipNewProjectResetOnce();
            }
            navigate(pendingReturnUrl, { replace: true });
          } else {
            setSkipNewProjectResetOnce();
            navigate(ROUTES.PROJECT_NEW, { replace: true });
          }
        } else {
          const returnUrl = pendingReturnUrl ?? getReturnUrl();
          if (returnUrl) {
            clearReturnUrl();
            navigate(returnUrl, { replace: true });
          } else {
            navigate(ROUTES.HOME, { replace: true });
          }
        }
      } catch {
        setUser(null);
        navigate(ROUTES.HOME, { replace: true });
      }
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [navigate, searchParams, setUser]);

  return (
    <Flex align="center" justify="center" className="h-full w-full">
      <Spin size="large" />
    </Flex>
  );
};

export default AuthCallbackPage;
