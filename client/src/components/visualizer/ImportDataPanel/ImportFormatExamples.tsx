import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import type { ImportDataType } from '@/types/mapData';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  importDataType: ImportDataType;
  hasHistoricalFormat: boolean;
};

const FORMAT_PRE_CLASS = 'font-mono text-xs text-gray-600 min-w-max';
const FORMAT_SCROLL_WRAP_CLASS = 'w-full overflow-x-auto rounded';

export const ImportFormatExamples: FC<Props> = ({ importDataType, hasHistoricalFormat }) => {
  const { t } = useTypedTranslation();

  const STATIC_EXAMPLES: Record<ImportDataType, React.ReactNode> = {
    csv: (
      <div className={FORMAT_SCROLL_WRAP_CLASS}>
        <pre className={FORMAT_PRE_CLASS}>
          {`id,label,value
Moscow,Moscow Oblast,2500
Saint Petersburg,St. Petersburg,1800`}
        </pre>
      </div>
    ),
    excel: (
      <Flex vertical gap={4} className="min-w-0 text-xs text-gray-600">
        <Typography.Text className="text-xs text-gray-600">
          {t('visualizer.importFormatExamples.excelColumnsStatic')}
        </Typography.Text>
        <div className={FORMAT_SCROLL_WRAP_CLASS}>
          <pre className={FORMAT_PRE_CLASS}>
            {`| id     | label       | value |
| Moscow | Moscow City | 2500  |`}
          </pre>
        </div>
      </Flex>
    ),
    json: (
      <div className={FORMAT_SCROLL_WRAP_CLASS}>
        <pre className={FORMAT_PRE_CLASS}>
          {`[
  { "id": "Moscow", "label": "Moscow City", "value": 2500 },
  { "id": "Saint Petersburg", "label": "St. Petersburg", "value": 1800 }
]`}
        </pre>
      </div>
    ),
    sheets: (
      <Flex vertical gap={4} className="min-w-0 text-xs text-gray-600">
        <Typography.Text className="text-xs text-gray-600">
          {t('visualizer.importFormatExamples.sheetsColumnsStatic')}
        </Typography.Text>
        <div className={FORMAT_SCROLL_WRAP_CLASS}>
          <pre className={FORMAT_PRE_CLASS}>
            {`| id     | label       | value |
| Moscow | Moscow City | 2500  |`}
          </pre>
        </div>
      </Flex>
    ),
    manual: (
      <Typography.Text className="text-xs text-gray-600">
        {t('visualizer.importFormatExamples.manualStatic')}
      </Typography.Text>
    ),
  };

  const HISTORICAL_EXAMPLES: Record<ImportDataType, React.ReactNode> = {
    csv: (
      <div className={FORMAT_SCROLL_WRAP_CLASS}>
        <pre className={FORMAT_PRE_CLASS}>
          {`year,id,label,value
2020,Moscow,Moscow Oblast,2500
2020,Saint Petersburg,St. Petersburg,1800
2021,Moscow,Moscow Oblast,2700
2021,Saint Petersburg,St. Petersburg,1900`}
        </pre>
      </div>
    ),
    excel: (
      <Flex vertical gap={4} className="min-w-0 text-xs text-gray-600">
        <Typography.Text className="text-xs text-gray-600">
          {t('visualizer.importFormatExamples.excelColumnsTime')}
        </Typography.Text>
        <div className={FORMAT_SCROLL_WRAP_CLASS}>
          <pre className={FORMAT_PRE_CLASS}>
            {`| year | id     | label       | value |
| 2020 | Moscow | Moscow City | 2500  |
| 2021 | Moscow | Moscow City | 2700  |`}
          </pre>
        </div>
      </Flex>
    ),
    json: (
      <div className={FORMAT_SCROLL_WRAP_CLASS}>
        <pre className={FORMAT_PRE_CLASS}>
          {`[
  { "year": "2020", "label": "Moscow", "value": 2500 },
  { "year": "2021", "label": "Moscow", "value": 2700 }
]`}
        </pre>
      </div>
    ),
    sheets: (
      <Flex vertical gap={4} className="min-w-0 text-xs text-gray-600">
        <Typography.Text className="text-xs text-gray-600">
          {t('visualizer.importFormatExamples.sheetsColumnsTime')}
        </Typography.Text>
        <div className={FORMAT_SCROLL_WRAP_CLASS}>
          <pre className={FORMAT_PRE_CLASS}>
            {`| year | id     | label       | value |
| 2020 | Moscow | Moscow City | 2500  |
| 2021 | Moscow | Moscow City | 2700  |`}
          </pre>
        </div>
      </Flex>
    ),
    manual: (
      <Typography.Text className="text-xs text-gray-600">
        {t('visualizer.importFormatExamples.manualHistorical')}
      </Typography.Text>
    ),
  };

  const examples = hasHistoricalFormat ? HISTORICAL_EXAMPLES : STATIC_EXAMPLES;
  return <>{examples[importDataType]}</>;
};
