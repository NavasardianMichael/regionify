import { type FC, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import type { UserPublic } from '@/api/auth/types';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';

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
      } catch {
        setUser(null);
      }
    }

    navigate(ROUTES.HOME, { replace: true });
  }, [navigate, searchParams, setUser]);

  return (
    <Flex align="center" justify="center" className="h-full w-full">
      <Spin size="large" />
    </Flex>
  );
};

export default AuthCallbackPage;
