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

        // Restore temporary project state: merge partial with defaults, then apply
        const partial = getTemporaryProjectState();
        if (partial && Object.keys(partial).length > 0) {
          const merged = mergeTemporaryStateWithDefaults(partial);
          applyFullTemporaryProjectState(merged);
          clearTemporaryProjectState();
        }

        // Redirect to return URL or home
        const returnUrl = getReturnUrl();
        if (returnUrl) {
          clearReturnUrl();
          navigate(returnUrl, { replace: true });
        } else {
          navigate(ROUTES.HOME, { replace: true });
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
