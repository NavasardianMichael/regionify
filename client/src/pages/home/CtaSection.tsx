import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppButtonStyleLink } from '@/components/ui/AppButtonStyleLink';

export const CtaSection: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <section className="bg-primary px-6 py-16 md:py-24">
      <div className="mx-auto w-full max-w-2xl">
        <Flex vertical gap="large" align="center" className="text-center">
          <Flex vertical gap="small" align="center">
            <Typography.Title
              level={2}
              className="mb-0! text-3xl font-bold text-white! md:text-4xl"
              data-i18n-key="home.ctaBottomTitle"
            >
              {t('home.ctaBottomTitle')}
            </Typography.Title>
            <Typography.Paragraph
              className="mb-0! text-lg"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              data-i18n-key="home.ctaBottomSubtitle"
            >
              {t('home.ctaBottomSubtitle')}
            </Typography.Paragraph>
          </Flex>
          <AppButtonStyleLink
            href={ROUTES.PROJECT_NEW}
            type="dashed"
            className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
            data-i18n-key="home.ctaStart"
          >
            {t('home.ctaStart')}
          </AppButtonStyleLink>
        </Flex>
      </div>
    </section>
  );
};
