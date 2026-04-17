import { type FC, useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Button, Flex, Result } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const AppErrorPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Flex vertical align="center" justify="center" className="min-h-screen w-full">
      <Result
        status="500"
        title={t('errors.appCrashed')}
        extra={[
          <Button type="dashed" key="home" onClick={() => void navigate(ROUTES.HOME)}>
            {t('errors.goHome')}
          </Button>,
          <Button type="dashed" key="reload" onClick={() => window.location.reload()}>
            {t('errors.reload')}
          </Button>,
        ]}
      />
    </Flex>
  );
};

export default AppErrorPage;
