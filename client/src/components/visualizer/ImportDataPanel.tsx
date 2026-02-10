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
  DownloadOutlined,
  EditOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { PLAN_FEATURE_LIMITS, PLANS } from '@regionify/shared';
import type { UploadProps } from 'antd';
import { Button, Flex, message, Modal, Segmented, Spin, Tooltip, Typography, Upload } from 'antd';
import * as XLSX from 'xlsx';
import {
  selectClearTimelineData,
  selectData,
  selectImportDataType,
  selectSelectedRegionId,
  selectSetTimelineData,
  selectSetVisualizerState,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet, RegionData } from '@/store/mapData/types';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import type { ImportDataType } from '@/types/mapData';
import { loadMapSvg } from '@/helpers/mapLoader';
import { extractSvgTitles, mapDataToSvgRegions } from '@/helpers/textSimilarity';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const ManualDataEntryModal = lazy(() => import('./ManualDataEntryModal'));

/**
 * Parsed row from user data
 * id - optional region identifier (SVG path title)
 * label - display label for the region
 * value - numeric value for visualization
 * timePeriod - optional time period for historical data animation
 */
type ParsedRow = { id?: string; label: string; value: number; timePeriod?: string };

const TIME_COLUMN_PATTERN = /^(year|time|period|date|month|quarter|season|epoch|era)$/i;

const hasTimeColumn = (header: string): boolean => {
  const parts = header.split(/[,;\t]/).map((s) => s.trim());
  return parts.some((p) => TIME_COLUMN_PATTERN.test(p));
};

const getTimeColumnIndex = (header: string): number => {
  const parts = header.split(/[,;\t]/).map((s) => s.trim());
  return parts.findIndex((p) => TIME_COLUMN_PATTERN.test(p));
};

const IMPORT_OPTIONS: { label: string; value: ImportDataType }[] = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
  { label: 'JSON', value: 'json' },
  { label: 'Sheets', value: 'sheets' },
  { label: 'Manual', value: 'manual' },
];

/**
 * Detect if header row contains an 'id' column
 */
const hasIdColumn = (header: string): boolean => {
  const parts = header.split(/[,;\t]/).map((s) => s.trim().toLowerCase());
  return parts.some((p) => p === 'id');
};

const parseCSV = (content: string): ParsedRow[] => {
  const lines = content.trim().split('\n');
  const data: ParsedRow[] = [];

  // Detect header format
  const headerLine = lines[0] || '';
  const hasId = hasIdColumn(headerLine);
  const hasTime = hasTimeColumn(headerLine);
  const timeIdx = hasTime ? getTimeColumnIndex(headerLine) : -1;
  const isHeader = /^(id|label|region|name)/i.test(headerLine) || hasTime;
  const startIndex = isHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    let parts: string[];

    if (line.includes('"')) {
      parts = line.match(/(?:[^,"]|"(?:\\.|[^"])*")+/g) || [];
      parts = parts.map((s) => s.replace(/^"|"$/g, '').trim());
    } else {
      parts = line.split(/[,;\t]/).map((s) => s.trim());
    }

    const timePeriod = hasTime && timeIdx >= 0 ? parts[timeIdx] : undefined;
    // Remove time column from parts so id/label/value parsing stays unchanged
    const filteredParts =
      hasTime && timeIdx >= 0 ? parts.filter((_, idx) => idx !== timeIdx) : parts;

    if (hasId) {
      const [id, label, valueStr] = filteredParts;
      const value = parseFloat(valueStr);
      if (label && !isNaN(value)) {
        data.push({ id: id || undefined, label, value, timePeriod: timePeriod || undefined });
      }
    } else {
      const [label, valueStr] = filteredParts;
      const value = parseFloat(valueStr);
      if (label && !isNaN(value)) {
        data.push({ label, value, timePeriod: timePeriod || undefined });
      }
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
    const keys = Object.keys(row);

    // Check for id column
    const idKey = keys.find((key) => key.toLowerCase() === 'id');
    const labelKey = keys.find((key) =>
      /^(label|region|name|area|province|state|country)/i.test(String(key)),
    );
    const valueKey = keys.find((key) =>
      /^(value|count|amount|number|data|total|population)/i.test(String(key)),
    );
    const timeKey = keys.find((key) => TIME_COLUMN_PATTERN.test(String(key)));

    // Determine column order based on available keys
    const id = idKey ? String(row[idKey] ?? '') : undefined;
    const label = String(row[labelKey ?? keys[idKey ? 1 : 0]] ?? '');
    const value = parseFloat(String(row[valueKey ?? keys[idKey ? 2 : 1]] ?? ''));
    const timePeriod = timeKey ? String(row[timeKey] ?? '') : undefined;

    if (label && !isNaN(value)) {
      data.push({ id: id || undefined, label, value, timePeriod: timePeriod || undefined });
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
        .map((item) => {
          const rawTime = item.year ?? item.time ?? item.period ?? item.date ?? item.month;
          return {
            id: item.id ? String(item.id) : undefined,
            label: String(item.label ?? item.region ?? item.name ?? ''),
            value: Number(item.value ?? item.count ?? 0),
            timePeriod: rawTime !== undefined && rawTime !== null ? String(rawTime) : undefined,
          };
        });
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
  const setTimelineData = useVisualizerStore(selectSetTimelineData);
  const clearTimelineData = useVisualizerStore(selectClearTimelineData);
  const data = useVisualizerStore(selectData);

  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.free;
  const limits = PLAN_FEATURE_LIMITS[plan];

  const handleDownloadData = useCallback(() => {
    if (data.allIds.length === 0) {
      message.warning('No data available to download');
      return;
    }

    const rows = data.allIds.map((id) => ({
      id: data.byId[id].id,
      label: data.byId[id].label,
      value: data.byId[id].value,
    }));

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (importDataType) {
      case 'json':
        content = JSON.stringify(rows, null, 2);
        filename = 'data.json';
        mimeType = 'application/json';
        break;
      case 'excel': {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, 'data.xlsx');
        return;
      }
      case 'csv':
      default:
        content = 'id,label,value\n' + rows.map((r) => `${r.id},${r.label},${r.value}`).join('\n');
        filename = 'data.csv';
        mimeType = 'text/csv';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, importDataType]);

  // Load SVG titles and generate sample data when region changes
  useEffect(() => {
    let cancelled = false;

    const loadSvgTitlesAndGenerateSampleData = async () => {
      if (!selectedRegionId) {
        setSvgTitles([]);
        setVisualizerState({ data: { allIds: [], byId: {} } });
        clearTimelineData();
        return;
      }

      try {
        const svgContent = await loadMapSvg(selectedRegionId);
        if (svgContent && !cancelled) {
          const titles = extractSvgTitles(svgContent);
          setSvgTitles(titles);

          // Generate sample data for visualization preview
          if (titles.length > 0) {
            const sampleData = titles.map((title) => ({
              id: title,
              label: title,
              value: Math.floor(Math.random() * 900) + 100, // Random value 100-999
            }));

            const allIds = sampleData.map((item) => item.id);
            const byId = Object.fromEntries(sampleData.map((item) => [item.id, item]));

            clearTimelineData();
            setVisualizerState({ data: { allIds, byId } });
          }
        }
      } catch (error) {
        console.error('Failed to load SVG titles:', error);
        if (!cancelled) {
          setSvgTitles([]);
        }
      }
    };

    loadSvgTitlesAndGenerateSampleData();

    return () => {
      cancelled = true;
    };
  }, [selectedRegionId, setVisualizerState, clearTimelineData]);

  /** Process parsed rows — groups by time period for Atlas users or imports flat data. */
  const processImportedData = useCallback(
    (parsed: ParsedRow[], onSuccess?: (data: unknown) => void) => {
      const hasTimePeriods = parsed.some((row) => row.timePeriod !== undefined);

      if (hasTimePeriods && limits.historicalDataImport) {
        // Group by time period (preserve order of first appearance)
        const grouped: Record<string, ParsedRow[]> = {};
        const periodOrder: string[] = [];

        for (const row of parsed) {
          const period = String(row.timePeriod ?? 'Unknown');
          if (!grouped[period]) {
            grouped[period] = [];
            periodOrder.push(period);
          }
          grouped[period].push(row);
        }

        const timeline: Record<string, DataSet> = {};
        for (const period of periodOrder) {
          timeline[period] = convertToRegionData(grouped[period], svgTitles);
        }

        setTimelineData(timeline, periodOrder);
        message.success(`Imported ${parsed.length} rows across ${periodOrder.length} time periods`);
        onSuccess?.(timeline);
      } else {
        if (hasTimePeriods && !limits.historicalDataImport) {
          message.info(
            'Time series data detected. Upgrade to Atlas plan for animated visualizations.',
          );
        }
        const regionData = convertToRegionData(parsed, svgTitles);
        clearTimelineData();
        setVisualizerState({ data: regionData });
        message.success(`Imported ${parsed.length} regions`);
        onSuccess?.(regionData);
      }
    },
    [
      limits.historicalDataImport,
      svgTitles,
      setVisualizerState,
      setTimelineData,
      clearTimelineData,
    ],
  );

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

            processImportedData(parsed, onSuccess);
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

          processImportedData(parsed, onSuccess);
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
    [importDataType, processImportedData],
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
          {`id,label,value
Moscow,Moscow Oblast,2500
Saint Petersburg,St. Petersburg,1800

# or without id (auto-match):
label,value
Moscow,2500`}
        </pre>
      ),
      excel: (
        <Flex vertical gap={4} className="text-xs text-gray-600">
          <Typography.Text className="text-xs text-gray-600">
            Excel file with columns:
          </Typography.Text>
          <pre className="font-mono text-xs text-gray-600">
            {`| id     | label       | value |
| Moscow | Moscow City | 2500  |

# id column is optional`}
          </pre>
        </Flex>
      ),
      json: (
        <pre className="font-mono text-xs text-gray-600">
          {`[
  { "id": "Moscow", "label": "Moscow City", "value": 2500 },
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
            {`| id     | label       | value |
| Moscow | Moscow City | 2500  |

# id column is optional`}
          </pre>
        </Flex>
      ),
      manual: (
        <Typography.Text className="text-xs text-gray-600">
          Enter region IDs, labels and their corresponding values using the form.
        </Typography.Text>
      ),
    }),
    [],
  );

  const formatInfoContent = (
    <ul className="m-0 list-disc space-y-2 pl-4 text-sm text-gray-600">
      <li>
        <strong>id</strong> — (Optional) Region ID matching SVG path title
      </li>
      <li>
        <strong>label</strong> — Display label for the region
      </li>
      <li>
        <strong>value</strong> — Numeric value for the region
      </li>
      <li>If id is missing, we match labels to SVG regions automatically</li>
      <li>Labels are displayed on the map when &quot;Show Labels&quot; is enabled</li>
    </ul>
  );

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <SectionTitle IconComponent={FileExcelOutlined}>Import Data</SectionTitle>
        <Flex gap={4}>
          <Tooltip
            title={
              data.allIds.length === 0
                ? 'Select country to download some sample data'
                : 'Download data in selected format'
            }
          >
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size="small"
              onClick={handleDownloadData}
              className="text-gray-500"
              disabled={data.allIds.length === 0}
              aria-label="Download data"
            />
          </Tooltip>
          <Tooltip title="Enter Data Manually">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => setIsManualModalOpen(true)}
              className="text-gray-500"
              aria-label="Enter data manually"
            />
          </Tooltip>
        </Flex>
      </Flex>

      <Segmented
        options={IMPORT_OPTIONS}
        value={importDataType}
        onChange={(value: string | number) =>
          setVisualizerState({ importDataType: value as ImportDataType })
        }
        block
        aria-label="Import data format"
      />

      <Flex gap="small" align="center">
        <Typography.Text className="text-sm text-gray-500">
          Upload your dataset to visualize regional metrics
        </Typography.Text>
        <button
          type="button"
          className="hover:text-primary cursor-pointer border-none bg-transparent p-0 text-gray-400"
          onClick={() => setIsFormatInfoModalOpen(true)}
          aria-label="View expected data format"
        >
          <InfoCircleOutlined />
        </button>
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
