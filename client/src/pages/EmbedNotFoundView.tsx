import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Button, Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { Card } from '@/components/ui/Card';

export const EmbedNotFoundView: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <Flex align="center" justify="center" className="h-full min-h-[240px] w-full p-4">
      <Card className="w-full max-w-lg shadow-sm">
        <Flex vertical align="center" gap="middle">
          <Typography.Title level={3} className="text-primary mb-0! text-center">
            {t('visualizer.embed.embedNotFoundTitle')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="mb-0! text-center">
            {t('visualizer.embed.embedNotFoundDescription')}
          </Typography.Paragraph>
          <Link to={ROUTES.PROJECTS}>
            <Button type="primary">{t('visualizer.embed.embedNotFoundOpenProjects')}</Button>
          </Link>
        </Flex>
      </Card>
    </Flex>
  );
};
