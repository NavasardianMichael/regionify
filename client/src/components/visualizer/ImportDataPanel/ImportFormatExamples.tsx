import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import type { ImportDataType } from '@/types/mapData';

type Props = {
  importDataType: ImportDataType;
  hasHistoricalFormat: boolean;
};

const STATIC_EXAMPLES: Record<ImportDataType, React.ReactNode> = {
  csv: (
    <pre className="font-mono text-xs text-gray-600">
      {`id,label,value
Moscow,Moscow Oblast,2500
Saint Petersburg,St. Petersburg,1800`}
    </pre>
  ),
  excel: (
    <Flex vertical gap={4} className="text-xs text-gray-600">
      <Typography.Text className="text-xs text-gray-600">Excel file with columns:</Typography.Text>
      <pre className="font-mono text-xs text-gray-600">
        {`| id     | label       | value |
| Moscow | Moscow City | 2500  |`}
      </pre>
    </Flex>
  ),
  json: (
    <pre className="font-mono text-xs text-gray-600">
      {`[
  { "id": "Moscow", "label": "Moscow City", "value": 2500 },
  { "id": "Saint Petersburg", "label": "St. Petersburg", "value": 1800 }
]`}
    </pre>
  ),
  sheets: (
    <Flex vertical gap={4} className="text-xs text-gray-600">
      <Typography.Text className="text-xs text-gray-600">
        Google Sheet with columns:
      </Typography.Text>
      <pre className="font-mono text-xs text-gray-600">
        {`| id     | label       | value |
| Moscow | Moscow City | 2500  |`}
      </pre>
    </Flex>
  ),
  manual: (
    <Typography.Text className="text-xs text-gray-600">
      Enter region IDs, labels and their corresponding values using the form.
    </Typography.Text>
  ),
};

const HISTORICAL_EXAMPLES: Record<ImportDataType, React.ReactNode> = {
  csv: (
    <pre className="font-mono text-xs text-gray-600">
      {`year,id,label,value
2020,Moscow,Moscow Oblast,2500
2020,Saint Petersburg,St. Petersburg,1800
2021,Moscow,Moscow Oblast,2700
2021,Saint Petersburg,St. Petersburg,1900`}
    </pre>
  ),
  excel: (
    <Flex vertical gap={4} className="text-xs text-gray-600">
      <Typography.Text className="text-xs text-gray-600">
        Excel file with columns including a time column:
      </Typography.Text>
      <pre className="font-mono text-xs text-gray-600">
        {`| year | id     | label       | value |
| 2020 | Moscow | Moscow City | 2500  |
| 2021 | Moscow | Moscow City | 2700  |`}
      </pre>
    </Flex>
  ),
  json: (
    <pre className="font-mono text-xs text-gray-600">
      {`[
  { "year": "2020", "label": "Moscow", "value": 2500 },
  { "year": "2021", "label": "Moscow", "value": 2700 }
]`}
    </pre>
  ),
  sheets: (
    <Flex vertical gap={4} className="text-xs text-gray-600">
      <Typography.Text className="text-xs text-gray-600">
        Google Sheet with a time column:
      </Typography.Text>
      <pre className="font-mono text-xs text-gray-600">
        {`| year | id     | label       | value |
| 2020 | Moscow | Moscow City | 2500  |
| 2021 | Moscow | Moscow City | 2700  |`}
      </pre>
    </Flex>
  ),
  manual: (
    <Typography.Text className="text-xs text-gray-600">
      Enter region IDs, labels and their corresponding values with time periods using the form.
    </Typography.Text>
  ),
};

export const ImportFormatExamples: FC<Props> = ({ importDataType, hasHistoricalFormat }) => {
  const examples = hasHistoricalFormat ? HISTORICAL_EXAMPLES : STATIC_EXAMPLES;
  return <>{examples[importDataType]}</>;
};
