import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Button, Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { Card } from '@/components/ui/Card';

export const EmbedNotFoundView: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <Flex align="center" justify="center" className="min-h-60 min-w-0 flex-1 p-4">
      <Card className="w-full max-w-lg min-w-0 shadow-sm">
        <Flex vertical gap="middle" className="w-full min-w-0">
          <Typography.Title level={3} className="text-primary mb-0! text-center">
            {t('visualizer.embed.embedNotFoundTitle')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="mb-0! text-center wrap-break-word">
            {t('visualizer.embed.embedNotFoundDescription')}
          </Typography.Paragraph>
          <Flex justify="center">
            <Link to={ROUTES.PROJECTS}>
              <Button type="primary">{t('visualizer.embed.embedNotFoundOpenProjects')}</Button>
            </Link>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};
