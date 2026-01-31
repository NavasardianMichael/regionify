import {
  type FC,
  type JSX,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CloudUploadOutlined,
  EditOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Flex, message, Modal, Segmented, Spin, Tooltip, Typography, Upload } from 'antd';
import * as XLSX from 'xlsx';
import {
  selectImportDataType,
  selectSelectedRegionId,
  selectSetVisualizerState,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import type { RegionData } from '@/store/mapData/types';
import type { ImportDataType } from '@/types/mapData';
import { extractSvgTitles, mapDataToSvgRegions } from '@/helpers/textSimilarity';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const ManualDataEntryModal = lazy(() => import('./ManualDataEntryModal'));

type ParsedRow = { label: string; value: number };

const IMPORT_OPTIONS: { label: string; value: ImportDataType }[] = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
  { label: 'JSON', value: 'json' },
  { label: 'Sheets', value: 'sheets' },
  { label: 'Manual', value: 'manual' },
];

const parseCSV = (content: string): ParsedRow[] => {
  const lines = content.trim().split('\n');
  const data: ParsedRow[] = [];

  // Skip header row if it looks like a header
  const startIndex = /^label|^region|^name/i.test(lines[0]) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    // Handle quoted values and different separators
    const line = lines[i];
    let parts: string[];

    if (line.includes('"')) {
      // Handle CSV with quoted values
      parts = line.match(/(?:[^,"]|"(?:\\.|[^"])*")+/g) || [];
      parts = parts.map((s) => s.replace(/^"|"$/g, '').trim());
    } else {
      parts = line.split(/[,;\t]/).map((s) => s.trim());
    }

    const [label, valueStr] = parts;
    const value = parseFloat(valueStr);

    if (label && !isNaN(value)) {
      data.push({ label, value });
    }
  }

  return data;
};

const parseExcel = (buffer: ArrayBuffer): ParsedRow[] => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  const data: ParsedRow[] = [];

  for (const row of jsonData) {
    // Try to find label and value columns with flexible naming
    const labelKey = Object.keys(row).find((key) =>
      /^(label|region|name|area|province|state|country)/i.test(String(key)),
    );
    const valueKey = Object.keys(row).find((key) =>
      /^(value|count|amount|number|data|total|population)/i.test(String(key)),
    );

    // Fallback to first two columns if no matching headers
    const keys = Object.keys(row);
    const label = String(row[labelKey ?? keys[0]] ?? '');
    const value = parseFloat(String(row[valueKey ?? keys[1]] ?? ''));

    if (label && !isNaN(value)) {
      data.push({ label, value });
    }
  }

  return data;
};

const parseJSON = (content: string): ParsedRow[] => {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => {
          const hasLabel = item.label || item.region || item.name;
          const hasValue = typeof item.value === 'number' || typeof item.count === 'number';
          return hasLabel && hasValue;
        })
        .map((item) => ({
          label: String(item.label ?? item.region ?? item.name ?? ''),
          value: Number(item.value ?? item.count ?? 0),
        }));
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Convert parsed data to RegionData format with similarity matching
 * Uses SVG titles to match user labels to region IDs
 */
const convertToRegionData = (
  parsed: ParsedRow[],
  svgTitles: string[],
): { allIds: string[]; byId: Record<string, RegionData> } => {
  // Map data using similarity matching
  const mappedData = mapDataToSvgRegions(parsed, svgTitles);

  const allIds = mappedData.map((item) => item.id);
  const byId = Object.fromEntries(
    mappedData.map((item) => [item.id, { id: item.id, label: item.label, value: item.value }]),
  );

  return { allIds, byId };
};

export const ImportDataPanel: FC = () => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isFormatInfoModalOpen, setIsFormatInfoModalOpen] = useState(false);
  const [svgTitles, setSvgTitles] = useState<string[]>([]);

  const importDataType = useVisualizerStore(selectImportDataType);
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  // Load SVG titles when region changes
  useEffect(() => {
    let cancelled = false;

    const loadSvgTitles = async () => {
      if (!selectedRegionId) {
        setSvgTitles([]);
        return;
      }

      try {
        const mapFile = `${selectedRegionId}.svg`;
        const response = await fetch(`/src/assets/images/maps/${mapFile}`);
        if (response.ok && !cancelled) {
          const svgContent = await response.text();
          const titles = extractSvgTitles(svgContent);
          setSvgTitles(titles);
        }
      } catch (error) {
        console.error('Failed to load SVG titles:', error);
        if (!cancelled) {
          setSvgTitles([]);
        }
      }
    };

    loadSvgTitles();

    return () => {
      cancelled = true;
    };
  }, [selectedRegionId]);

  const handleFileUpload: UploadProps['customRequest'] = useCallback(
    (options: Parameters<NonNullable<UploadProps['customRequest']>>[0]) => {
      const { file, onSuccess, onError } = options;

      // Handle Excel files differently (binary)
      if (importDataType === 'excel') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            const parsed = parseExcel(buffer);

            if (parsed.length === 0) {
              message.warning('No valid data found in Excel file');
              onError?.(new Error('No valid data found'));
              return;
            }

            const data = convertToRegionData(parsed, svgTitles);
            setVisualizerState({ data });
            message.success(`Imported ${parsed.length} regions`);
            onSuccess?.(data);
          } catch (error) {
            message.error('Failed to parse Excel file');
            onError?.(error as Error);
          }
        };
        reader.onerror = () => onError?.(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file as File);
        return;
      }

      // Handle text-based files (CSV, JSON)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsed: ParsedRow[] = [];

          if (importDataType === 'csv') {
            parsed = parseCSV(content);
          } else if (importDataType === 'json') {
            parsed = parseJSON(content);
          }

          if (parsed.length === 0) {
            message.warning('No valid data found in file');
            onError?.(new Error('No valid data found'));
            return;
          }

          const data = convertToRegionData(parsed, svgTitles);
          setVisualizerState({ data });
          message.success(`Imported ${parsed.length} regions`);
          onSuccess?.(data);
        } catch (error) {
          message.error('Failed to parse file');
          onError?.(error as Error);
        }
      };

      reader.onerror = () => {
        onError?.(new Error('Failed to read file'));
      };

      reader.readAsText(file as File);
    },
    [importDataType, setVisualizerState, svgTitles],
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
          {`label,value
Moscow,2500
Saint Petersburg,1800`}
        </pre>
      ),
      excel: (
        <Flex vertical gap={4} className="text-xs text-gray-600">
          <Typography.Text className="text-xs text-gray-600">
            Excel file with columns:
          </Typography.Text>
          <pre className="font-mono text-xs text-gray-600">
            {`| label            | value |
| Moscow           | 2500  |
| Saint Petersburg | 1800  |`}
          </pre>
        </Flex>
      ),
      json: (
        <pre className="font-mono text-xs text-gray-600">
          {`[
  { "label": "Moscow", "value": 2500 },
  { "label": "Saint Petersburg", "value": 1800 }
]`}
        </pre>
      ),
      sheets: (
        <Flex vertical gap={4} className="text-xs text-gray-600">
          <Typography.Text className="text-xs text-gray-600">
            Google Sheet with columns:
          </Typography.Text>
          <pre className="font-mono text-xs text-gray-600">
            {`| label            | value |
| Moscow           | 2500  |
| Saint Petersburg | 1800  |`}
          </pre>
        </Flex>
      ),
      manual: (
        <Typography.Text className="text-xs text-gray-600">
          Enter region labels and their corresponding values using the form.
        </Typography.Text>
      ),
    }),
    [],
  );

  const formatInfoContent = (
    <ul className="m-0 list-disc space-y-2 pl-4 text-sm text-gray-600">
      <li>
        <strong>label</strong> — Region name (e.g., &quot;Moscow&quot;, &quot;California&quot;)
      </li>
      <li>
        <strong>value</strong> — Numeric value for the region
      </li>
      <li>Labels should match region names in English</li>
      <li>We will attempt to match labels with SVG region IDs</li>
      <li>Use similar naming conventions for best results</li>
    </ul>
  );

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <SectionTitle IconComponent={FileExcelOutlined}>Import Data</SectionTitle>
        <Tooltip title="Enter Data Manually">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => setIsManualModalOpen(true)}
            className="text-gray-500"
          />
        </Tooltip>
      </Flex>

      <Segmented
        options={IMPORT_OPTIONS}
        value={importDataType}
        onChange={(value) => setVisualizerState({ importDataType: value as ImportDataType })}
        block
      />

      <Flex gap="small">
        <Typography.Text className="text-sm text-gray-500">
          Upload your dataset to visualize regional metrics
        </Typography.Text>
        <InfoCircleOutlined
          className="hover:text-primary cursor-pointer text-gray-400"
          onClick={() => setIsFormatInfoModalOpen(true)}
        />
      </Flex>

      <Modal
        title="Expected Data Format"
        open={isFormatInfoModalOpen}
        onCancel={() => setIsFormatInfoModalOpen(false)}
        footer={null}
        width={400}
      >
        {formatInfoContent}
      </Modal>

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
