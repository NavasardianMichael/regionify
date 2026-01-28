import { type FC, useCallback, useState } from 'react';
import { CloudUploadOutlined, DatabaseOutlined, EditOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Segmented, Upload } from 'antd';
import { useVisualizerStore } from '@/store/useVisualizerStore';
import type { DataImportType, RegionData } from '@/types/visualizer';
import { ManualDataEntryModal } from './ManualDataEntryModal';

const IMPORT_OPTIONS: { label: string; value: DataImportType }[] = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
  { label: 'JSON', value: 'json' },
  { label: 'Sheets', value: 'sheets' },
  { label: 'Manual', value: 'manual' },
];

const parseCSV = (content: string): RegionData[] => {
  const lines = content.trim().split('\n');
  const data: RegionData[] = [];

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

const parseJSON = (content: string): RegionData[] => {
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

export const ImportDataPanel: FC = () => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const importType = useVisualizerStore((state) => state.importType);
  const setImportType = useVisualizerStore((state) => state.setImportType);
  const setRegionData = useVisualizerStore((state) => state.setRegionData);

  const handleFileUpload: UploadProps['customRequest'] = useCallback(
    (options) => {
      const { file, onSuccess, onError } = options;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let data: RegionData[] = [];

          if (importType === 'csv') {
            data = parseCSV(content);
          } else if (importType === 'json') {
            data = parseJSON(content);
          }

          setRegionData(data);
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
    [importType, setRegionData],
  );

  const getAcceptType = useCallback(() => {
    switch (importType) {
      case 'csv':
        return '.csv';
      case 'excel':
        return '.xlsx,.xls';
      case 'json':
        return '.json';
      default:
        return '*';
    }
  }, [importType]);

  const getButtonText = useCallback(() => {
    switch (importType) {
      case 'csv':
        return 'Choose CSV File';
      case 'excel':
        return 'Choose Excel File';
      case 'json':
        return 'Choose JSON File';
      case 'sheets':
        return 'Connect Google Sheets';
      case 'manual':
        return 'Enter Data Manually';
      default:
        return 'Choose File';
    }
  }, [importType]);

  return (
    <div className="space-y-md">
      <div className="gap-sm flex items-center">
        <DatabaseOutlined className="text-base text-gray-500" />
        <h3 className="text-primary text-base font-semibold">Import Data</h3>
      </div>

      <Segmented
        options={IMPORT_OPTIONS}
        value={importType}
        onChange={(value) => setImportType(value as DataImportType)}
        block
        size="middle"
        className="[&_.ant-segmented-item]:px-3 [&_.ant-segmented-item]:py-1.5"
      />

      <p className="text-sm text-gray-500">Upload your dataset to visualize regional metrics.</p>

      {importType === 'manual' ? (
        <Button
          type="primary"
          icon={<EditOutlined />}
          block
          size="large"
          onClick={() => setIsManualModalOpen(true)}
        >
          Enter Data Manually
        </Button>
      ) : importType === 'sheets' ? (
        <Button type="primary" icon={<CloudUploadOutlined />} block size="large">
          Connect Google Sheets
        </Button>
      ) : (
        <Upload
          accept={getAcceptType()}
          customRequest={handleFileUpload}
          showUploadList={false}
          maxCount={1}
        >
          <Button type="primary" icon={<CloudUploadOutlined />} block size="large">
            {getButtonText()}
          </Button>
        </Upload>
      )}

      <div className="p-sm rounded-md bg-gray-50">
        <p className="mb-xs text-xs font-medium text-gray-500">EXPECTED FORMAT:</p>
        <pre className="font-mono text-xs text-gray-600">
          {`region_id, value
RU-MOW, 2500
RU-SPE, 1800`}
        </pre>
      </div>

      <ManualDataEntryModal open={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} />
    </div>
  );
};
