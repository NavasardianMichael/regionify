import { type FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import { getMe } from '@/api/auth';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { applyFullTemporaryProjectState } from '@/helpers/applyFullTemporaryProjectState';
import {
  clearReturnUrl,
  clearTemporaryProjectState,
  getReturnUrl,
  getTemporaryProjectState,
  isSafeReturnUrl,
  mergeTemporaryStateWithDefaults,
  setSkipNewProjectResetOnce,
} from '@/helpers/temporaryProjectState';

const AuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const setUser = useProfileStore(selectSetUser);

  useEffect(() => {
    const run = async () => {
      try {
        const { user } = await getMe();
        setUser(user);

        const pendingReturnUrl = getReturnUrl();
        const partial = getTemporaryProjectState();
        const hadGuestDraft = Boolean(partial && Object.keys(partial).length > 0);

        if (hadGuestDraft && partial) {
          const merged = mergeTemporaryStateWithDefaults(partial);
          applyFullTemporaryProjectState(merged);
          clearTemporaryProjectState();

          if (pendingReturnUrl && isSafeReturnUrl(pendingReturnUrl)) {
            clearReturnUrl();
            if (
              pendingReturnUrl === ROUTES.PROJECT_NEW ||
              pendingReturnUrl.startsWith(`${ROUTES.PROJECT_NEW}?`)
            ) {
              setSkipNewProjectResetOnce();
            }
            navigate(pendingReturnUrl, { replace: true });
          } else {
            clearReturnUrl();
            setSkipNewProjectResetOnce();
            navigate(ROUTES.PROJECT_NEW, { replace: true });
          }
        } else {
          const returnUrl = pendingReturnUrl ?? getReturnUrl();
          if (returnUrl && isSafeReturnUrl(returnUrl)) {
            clearReturnUrl();
            navigate(returnUrl, { replace: true });
          } else {
            clearReturnUrl();
            navigate(ROUTES.PROJECTS, { replace: true });
          }
        }
      } catch {
        setUser(null);
        navigate(ROUTES.HOME, { replace: true });
      }
    };

    void run();
  }, [navigate, setUser]);

  return (
    <Flex align="center" justify="center" className="h-full w-full">
      <Spin size="large" />
    </Flex>
  );
};

export default AuthCallbackPage;
