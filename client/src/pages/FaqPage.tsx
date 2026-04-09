import type { FC } from 'react';
import { useMemo } from 'react';
import type { Locale } from '@regionify/shared';
import { Collapse, type CollapseProps, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { renderFaqAnswer } from '@/helpers/faqAnswer';

import { resources } from '@/locales';

const faqCollapseClassNames: NonNullable<CollapseProps['classNames']> = {
  body: 'bg-white px-5! py-3! rounded',
};

const FaqPage: FC = () => {
  const { t, i18n } = useTypedTranslation();

  const collapseItems = useMemo(() => {
    const items = resources[i18n.language as Locale].common.faq.items;
    return items.map((item, index) => ({
      key: `faq-${String(index)}`,
      label: (
        <Typography.Text className="mb-0! font-semibold text-gray-900">
          {item.question}
        </Typography.Text>
      ),
      children: (
        <Typography.Paragraph className="mb-0! text-gray-600">
          {renderFaqAnswer(item.answer)}
        </Typography.Paragraph>
      ),
    }));
  }, [i18n.language]);

  return (
    <Flex vertical gap="middle" className="mx-auto w-full max-w-4xl pb-6!">
      <Typography.Title level={1} className="text-primary text-2xl font-bold md:text-3xl">
        {t('faq.title')}
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600">{t('faq.intro')}</Typography.Paragraph>
      <Collapse
        bordered={false}
        className="bg-transparent!"
        classNames={faqCollapseClassNames}
        items={collapseItems}
      />
    </Flex>
  );
};

export default FaqPage;
