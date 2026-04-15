import { type FC, useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Button, Result } from 'antd';
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
    <Result
      status="500"
      title={t('errors.appCrashed')}
      extra={[
        <Button key="home" onClick={() => void navigate(ROUTES.HOME)}>
          {t('errors.goHome')}
        </Button>,
        <Button key="reload" onClick={() => window.location.reload()}>
          {t('errors.reload')}
        </Button>,
      ]}
    />
  );
};

export default AppErrorPage;
