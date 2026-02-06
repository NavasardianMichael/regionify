import { type FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import { getCurrentUser } from '@/api/auth';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';

const AuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const setUser = useProfileStore(selectSetUser);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setUser(user);
      navigate(ROUTES.HOME, { replace: true });
    };

    fetchUser();
  }, [navigate, setUser]);

  return (
    <Flex align="center" justify="center" className="h-full w-full">
      <Spin size="large" />
    </Flex>
  );
};

export default AuthCallbackPage;
