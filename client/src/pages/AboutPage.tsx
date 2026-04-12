import type { FC } from 'react';
import { Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';

const AboutPage: FC = () => {
  const { t } = useTypedTranslation();
  return (
    <Flex vertical gap="middle" className="max-w-4xl">
      <Typography.Title
        level={1}
        className="text-primary text-2xl font-bold md:text-3xl"
        data-i18n-key="about.title"
      >
        {t('about.title')}
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600" data-i18n-key="about.description">
        {t('about.description')}
      </Typography.Paragraph>
      <Typography.Paragraph className="mb-0!">
        <AppNavLink to={ROUTES.FAQ} className="font-medium" data-i18n-key="faq.title">
          {t('faq.title')}
        </AppNavLink>
      </Typography.Paragraph>
    </Flex>
  );
};

export default AboutPage;
