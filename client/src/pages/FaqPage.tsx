import type { FC } from 'react';
import { useMemo } from 'react';
import type { Locale } from '@regionify/shared';
import { Collapse, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

import { resources } from '@/locales';

const FaqPage: FC = () => {
  const { t, i18n } = useTypedTranslation();

  const collapseItems = useMemo(() => {
    const items = resources[i18n.language as Locale].common.faq.items;
    return items.map((item, index) => ({
      key: `faq-${String(index)}`,
      label: item.question,
      children: (
        <Typography.Paragraph className="mb-0! text-gray-600">{item.answer}</Typography.Paragraph>
      ),
    }));
  }, [i18n.language]);

  return (
    <Flex vertical gap="middle" className="mx-auto w-full max-w-4xl">
      <Typography.Title level={1} className="text-primary text-2xl font-bold md:text-3xl">
        {t('faq.title')}
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600">{t('faq.intro')}</Typography.Paragraph>
      <Collapse bordered={false} className="bg-transparent!" items={collapseItems} />
    </Flex>
  );
};

export default FaqPage;
