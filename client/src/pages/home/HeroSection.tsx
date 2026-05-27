import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import { useWorldMapUrl } from '@/hooks/useWorldMapUrl';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppButtonStyleLink } from '@/components/ui/AppButtonStyleLink';

export const HeroSection: FC = () => {
  const { t } = useTypedTranslation();
  const mapUrl = useWorldMapUrl();

  return (
    <section className="bg-primary relative overflow-hidden px-6 py-20 md:py-28 lg:py-32">
      {mapUrl && (
        <img
          src={mapUrl}
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 select-none"
        />
      )}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Flex vertical gap="middle" className="max-w-2xl text-left">
            <Typography.Title
              level={1}
              className="mb-0! text-4xl font-bold text-white! md:text-5xl lg:text-6xl"
              data-i18n-key="home.heroHeadline"
            >
              {t('home.heroHeadline')}
            </Typography.Title>
            <Typography.Paragraph
              className="mb-0! text-lg md:text-xl"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              data-i18n-key="home.heroSubheadline"
            >
              {t('home.heroSubheadline')}
            </Typography.Paragraph>
          </Flex>
          <Flex gap="middle" wrap="wrap" justify="start">
            <AppButtonStyleLink
              href={ROUTES.PROJECT_NEW}
              type="dashed"
              className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
              data-i18n-key="home.ctaStart"
            >
              {t('home.ctaStart')}
            </AppButtonStyleLink>
            <AppButtonStyleLink
              href={ROUTES.BILLING}
              type="dashed"
              className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
              data-i18n-key="home.ctaBadges"
            >
              {t('home.ctaBadges')}
            </AppButtonStyleLink>
          </Flex>
        </Flex>
      </div>
    </section>
  );
};
