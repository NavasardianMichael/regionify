import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const PaymentCancelPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();

  return (
    <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
      <Typography.Title level={3}>{t('badges.paymentCancelledTitle')}</Typography.Title>
      <Typography.Text type="secondary">{t('badges.paymentCancelledDesc')}</Typography.Text>
      <Button
        type="primary"
        onClick={() => navigate(ROUTES.BILLING)}
        data-i18n-key="badges.backToBadges"
      >
        {t('badges.backToBadges')}
      </Button>
    </Flex>
  );
};

export default PaymentCancelPage;
