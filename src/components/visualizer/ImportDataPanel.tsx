import { type FC, type JSX, lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  CloudUploadOutlined,
  DatabaseOutlined,
  EditOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Flex, Segmented, Spin, Typography, Upload } from 'antd';
import {
  selectImportDataType,
  selectSetVisualizerState,
  useVisualizerStore,
} from '@/store/mapData/store';
import type { RegionData } from '@/store/mapData/types';
import type { ImportDataType } from '@/types/mapData';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const ManualDataEntryModal = lazy(() => import('./ManualDataEntryModal'));

type ParsedData = { regionId: string; value: number };

const IMPORT_OPTIONS: { label: string; value: ImportDataType }[] = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
  { label: 'JSON', value: 'json' },
  { label: 'Sheets', value: 'sheets' },
  { label: 'Manual', value: 'manual' },
];

const parseCSV = (content: string): ParsedData[] => {
  const lines = content.trim().split('\n');
  const data: ParsedData[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const [regionId, valueStr] = lines[i].split(',').map((s) => s.trim());
    const value = parseFloat(valueStr);
    if (regionId && !isNaN(value)) {
      data.push({ regionId, value });
    }
  }

  return data;
};

const parseJSON = (content: string): ParsedData[] => {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item.regionId && typeof item.value === 'number')
        .map((item) => ({ regionId: item.regionId, value: item.value }));
    }
    return [];
  } catch {
    return [];
  }
};

const convertToRegionData = (
  parsed: ParsedData[],
): { allIds: string[]; byId: Record<string, RegionData> } => {
  const allIds = parsed.map((item) => item.regionId);
  const byId = Object.fromEntries(
    parsed.map((item) => [
      item.regionId,
      { id: item.regionId, label: item.regionId, value: item.value },
    ]),
  );
  return { allIds, byId };
};

export const ImportDataPanel: FC = () => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const importDataType = useVisualizerStore(selectImportDataType);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  const handleFileUpload: UploadProps['customRequest'] = useCallback(
    (options) => {
      const { file, onSuccess, onError } = options;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsed: ParsedData[] = [];

          if (importDataType === 'csv') {
            parsed = parseCSV(content);
          } else if (importDataType === 'json') {
            parsed = parseJSON(content);
          }

          const data = convertToRegionData(parsed);
          setVisualizerState({ data });
          onSuccess?.(data);
        } catch (error) {
          onError?.(error as Error);
        }
      };

      reader.onerror = () => {
        onError?.(new Error('Failed to read file'));
      };

      reader.readAsText(file as File);
    },
    [importDataType, setVisualizerState],
  );

  const importActionComponents: Record<ImportDataType, JSX.Element> = useMemo(
    () => ({
      manual: (
        <Button
          type="primary"
          icon={<EditOutlined />}
          block
          onClick={() => setIsManualModalOpen(true)}
        >
          Enter Data Manually
        </Button>
      ),
      sheets: (
        <Button type="primary" icon={<CloudUploadOutlined />} block>
          Connect Google Sheets
        </Button>
      ),
      csv: (
        <Upload accept=".csv" customRequest={handleFileUpload} showUploadList={false} maxCount={1}>
          <Button type="primary" icon={<CloudUploadOutlined />} block>
            Choose CSV File
          </Button>
        </Upload>
      ),
      excel: (
        <Upload
          accept=".xlsx,.xls"
          customRequest={handleFileUpload}
          showUploadList={false}
          maxCount={1}
        >
          <Button type="primary" icon={<CloudUploadOutlined />} block>
            Choose Excel File
          </Button>
        </Upload>
      ),
      json: (
        <Upload accept=".json" customRequest={handleFileUpload} showUploadList={false} maxCount={1}>
          <Button type="primary" icon={<CloudUploadOutlined />} block>
            Choose JSON File
          </Button>
        </Upload>
      ),
    }),
    [handleFileUpload],
  );

  const expectedFormatExamples: Record<ImportDataType, JSX.Element> = useMemo(
    () => ({
      csv: (
        <pre className="font-mono text-xs text-gray-600">
          {`region_id,value
RU-MOW,2500
RU-SPE,1800`}
        </pre>
      ),
      excel: (
        <Flex vertical gap={4} className="text-xs text-gray-600">
          <Typography.Text className="text-xs text-gray-600">
            Excel file with columns:
          </Typography.Text>
          <pre className="font-mono text-xs text-gray-600">
            {`| region_id | value |
| RU-MOW    | 2500  |
| RU-SPE    | 1800  |`}
          </pre>
        </Flex>
      ),
      json: (
        <pre className="font-mono text-xs text-gray-600">
          {`[
  { "regionId": "RU-MOW", "value": 2500 },
  { "regionId": "RU-SPE", "value": 1800 }
]`}
        </pre>
      ),
      sheets: (
        <Flex vertical gap={4} className="text-xs text-gray-600">
          <Typography.Text className="text-xs text-gray-600">
            Google Sheet with columns:
          </Typography.Text>
          <pre className="font-mono text-xs text-gray-600">
            {`| region_id | value |
| RU-MOW    | 2500  |
| RU-SPE    | 1800  |`}
          </pre>
        </Flex>
      ),
      manual: (
        <Typography.Text className="text-xs text-gray-600">
          Enter region IDs and their corresponding values using the form.
        </Typography.Text>
      ),
    }),
    [],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={FileExcelOutlined}>Import Data</SectionTitle>

      <Segmented
        options={IMPORT_OPTIONS}
        value={importDataType}
        onChange={(value) => setVisualizerState({ importDataType: value as ImportDataType })}
        block
      />

      <Typography.Paragraph className="text-sm text-gray-500">
        Upload your dataset to visualize regional metrics.
      </Typography.Paragraph>

      {importActionComponents[importDataType]}

      <Flex vertical gap="small" className="p-sm! rounded-md bg-gray-50">
        <Typography.Text className="text-xs font-medium text-gray-500">
          EXPECTED FORMAT:
        </Typography.Text>
        {expectedFormatExamples[importDataType]}
      </Flex>

      {isManualModalOpen && (
        <Suspense fallback={<Spin />}>
          <ManualDataEntryModal
            open={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
          />
        </Suspense>
      )}
    </Flex>
  );
};

export default ImportDataPanel;
