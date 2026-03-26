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
  LoadingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { extractGid, PLAN_DETAILS, PLANS } from '@regionify/shared';
import type { UploadProps } from 'antd';
import { Button, Flex, Segmented, Spin, Tooltip, Typography, Upload } from 'antd';
import * as XLSX from 'xlsx';
import {
  selectClearTimelineData,
  selectData,
  selectImportDataType,
  selectSelectedCountryId,
  selectSetTimelineData,
  selectSetVisualizerState,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet, RegionData } from '@/store/mapData/types';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { selectCurrentProject } from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import type { ImportDataType } from '@/types/mapData';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  convertToRegionData,
  IMPORT_FORMAT_ORDER,
  parseCSV,
  type ParsedRow,
  parseExcel,
  parseJSON,
  sanitizeFilename,
} from '@/helpers/importDataParsers';
import { loadMapSvg } from '@/helpers/mapLoader';
import { extractSvgTitles } from '@/helpers/textSimilarity';
import { showMessageWithSampleDownload } from '@/components/shared/showMessageWithSampleDownload';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { ImportFormatExamples } from '@/components/visualizer/ImportDataPanel/ImportFormatExamples';
import { ImportFormatInfoTooltip } from '@/components/visualizer/ImportDataPanel/ImportFormatInfoTooltip';
import { SwitchModeConfirmContent } from '@/components/visualizer/ImportDataPanel/SwitchModeConfirmContent';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const ManualDataEntryModal = lazy(() => import('./ManualDataEntryModal'));
const GoogleSheetsModal = lazy(() => import('./GoogleSheetsModal'));

const SUCCESS_MESSAGE_DURATION = 5;

/** Show a message. Success auto-hides after 5s; persistent types use duration 0 (global close control applies). */
function showMessageWithClose(
  messageApi: ReturnType<typeof useAppFeedback>['message'],
  type: 'success' | 'info' | 'warning' | 'error',
  content: string,
): void {
  if (type === 'success') {
    messageApi.success({ content, duration: SUCCESS_MESSAGE_DURATION });
    return;
  }
  messageApi[type]({ content, duration: 0 });
}

export const ImportDataPanel: FC = () => {
  const { t } = useTypedTranslation();
  const { modal, message: messageApi } = useAppFeedback();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [svgTitles, setSvgTitles] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);

  const importDataType = useVisualizerStore(selectImportDataType);
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const setTimelineData = useVisualizerStore(selectSetTimelineData);
  const clearTimelineData = useVisualizerStore(selectClearTimelineData);
  const data = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);

  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const { limits } = PLAN_DETAILS[plan];
  const currentProject = useProjectsStore(selectCurrentProject);

  /** Auto-detected: current data is panel/dynamic (has time dimension). */
  const hasHistoricalFormat = useMemo(() => {
    return (
      limits.historicalDataImport &&
      timePeriods &&
      Array.isArray(timePeriods) &&
      timePeriods.length > 0 &&
      timelineData &&
      Object.keys(timelineData).length > 0
    );
  }, [limits.historicalDataImport, timePeriods, timelineData]);

  /** Download current dataset only (no sample generation). */
  const handleDownloadData = useCallback(async () => {
    if (data.allIds.length === 0) {
      showMessageWithClose(messageApi, 'warning', t('messages.noDataToDownload'));
      return;
    }

    setIsDownloading(true);

    try {
      let rows: Array<{ id: string; label: string; value: number; year?: string }>;
      const useHistoricalFormat = Boolean(
        hasHistoricalFormat &&
        timePeriods &&
        Array.isArray(timePeriods) &&
        timePeriods.length > 0 &&
        timelineData,
      );

      if (
        useHistoricalFormat &&
        timePeriods &&
        Array.isArray(timePeriods) &&
        timePeriods.length > 0 &&
        timelineData
      ) {
        rows = [];
        for (const period of timePeriods) {
          const periodData = timelineData[period];
          if (periodData) {
            for (const id of periodData.allIds) {
              const item = periodData.byId[id];
              rows.push({
                id: item.id,
                label: item.label,
                value: item.value,
                year: period,
              });
            }
          }
        }
      } else {
        rows = data.allIds.map((id) => ({
          id: data.byId[id].id,
          label: data.byId[id].label,
          value: data.byId[id].value,
        }));
      }

      // Small delay to ensure UI updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get project name for filename, fallback to 'data'
      const projectName = currentProject?.name ? sanitizeFilename(currentProject.name) : 'data';
      const suffix = useHistoricalFormat ? '-historical' : '';

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (importDataType) {
        case 'json':
          content = JSON.stringify(rows, null, 2);
          filename = `${projectName}${suffix}.json`;
          mimeType = 'application/json';
          break;
        case 'excel': {
          const worksheet = XLSX.utils.json_to_sheet(rows);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          const filename = `${projectName}${suffix}.xlsx`;
          XLSX.writeFile(workbook, filename);
          setIsDownloading(false);
          return;
        }
        case 'csv':
        default: {
          const headers = useHistoricalFormat ? 'id,label,value,year' : 'id,label,value';
          const csvRows = rows.map((r) => {
            if (useHistoricalFormat && r.year) {
              return `${r.id},${r.label},${r.value},${r.year}`;
            }
            return `${r.id},${r.label},${r.value}`;
          });
          content = headers + '\n' + csvRows.join('\n');
          filename = `${projectName}${suffix}.csv`;
          mimeType = 'text/csv';
          break;
        }
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
    } catch (error) {
      console.error('Failed to download data:', error);
      showMessageWithClose(messageApi, 'error', t('messages.downloadDataFailed'));
    } finally {
      setIsDownloading(false);
    }
  }, [
    messageApi,
    data,
    importDataType,
    hasHistoricalFormat,
    timePeriods,
    timelineData,
    currentProject,
    t,
  ]);

  /** Download sample data only (template with region IDs for matching). */
  const handleDownloadSampleOnly = useCallback(async () => {
    if (!selectedCountryId || svgTitles.length === 0) return;

    setIsDownloadingSample(true);
    try {
      const useHistoricalFormat = limits.historicalDataImport;
      let rows: Array<{ id: string; label: string; value: number; year?: string }>;

      if (useHistoricalFormat) {
        const samplePeriods = ['2020', '2021', '2022', '2023', '2024'];
        rows = [];
        for (let p = 0; p < samplePeriods.length; p++) {
          const baseMultiplier = 1 + p * 0.3;
          for (const title of svgTitles) {
            rows.push({
              id: title,
              label: title,
              value: Math.floor(
                (100 + svgTitles.indexOf(title) * 50) * baseMultiplier + Math.random() * 200,
              ),
              year: samplePeriods[p],
            });
          }
        }
      } else {
        rows = svgTitles.map((title) => ({
          id: title,
          label: title,
          value: Math.floor(Math.random() * 900) + 100,
        }));
      }

      const projectName = currentProject?.name ? sanitizeFilename(currentProject.name) : 'data';
      const suffix = useHistoricalFormat ? '-historical' : '';
      const baseName = `${projectName}-sample${suffix}`;

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (importDataType) {
        case 'json':
          content = JSON.stringify(rows, null, 2);
          filename = `${baseName}.json`;
          mimeType = 'application/json';
          break;
        case 'excel': {
          const worksheet = XLSX.utils.json_to_sheet(rows);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          XLSX.writeFile(workbook, `${baseName}.xlsx`);
          setIsDownloadingSample(false);
          return;
        }
        case 'csv':
        default: {
          const headers = useHistoricalFormat ? 'id,label,value,year' : 'id,label,value';
          const csvRows = rows.map((r) => {
            if (useHistoricalFormat && r.year) {
              return `${r.id},${r.label},${r.value},${r.year}`;
            }
            return `${r.id},${r.label},${r.value}`;
          });
          content = headers + '\n' + csvRows.join('\n');
          filename = `${baseName}.csv`;
          mimeType = 'text/csv';
          break;
        }
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
    } catch (error) {
      console.error('Failed to download sample:', error);
      showMessageWithSampleDownload(
        messageApi,
        'error',
        t('messages.downloadSampleFailed'),
        handleDownloadSampleOnly,
        { downloadLabel: t('messages.downloadSample') },
      );
    } finally {
      setIsDownloadingSample(false);
    }
  }, [
    messageApi,
    selectedCountryId,
    svgTitles,
    limits.historicalDataImport,
    importDataType,
    currentProject,
    t,
  ]);

  const hasDataOrTimeline = data.allIds.length > 0 || timePeriods.length > 0;

  const importFormatOptions = useMemo(() => {
    const labelByType: Record<ImportDataType, string> = {
      csv: t('visualizer.importData.format.csv'),
      excel: t('visualizer.importData.format.excel'),
      json: t('visualizer.importData.format.json'),
      sheets: t('visualizer.importData.format.sheets'),
      manual: t('visualizer.importData.format.manual'),
    };
    return IMPORT_FORMAT_ORDER.map((value) => ({
      label: labelByType[value],
      value,
    }));
  }, [t]);

  /** Apply static mode: clear timeline and set data to sample (or empty if no region). */
  const applySwitchToStatic = useCallback(() => {
    clearTimelineData();
    if (svgTitles.length > 0) {
      const sampleData = svgTitles.map((title) => ({
        id: title,
        label: title,
        value: Math.floor(Math.random() * 900) + 100,
      }));
      const allIds = sampleData.map((item) => item.id);
      const byId = Object.fromEntries(sampleData.map((item) => [item.id, item as RegionData]));
      setVisualizerState({ data: { allIds, byId } });
    } else {
      setVisualizerState({ data: { allIds: [], byId: {} } });
    }
    showMessageWithClose(messageApi, 'success', t('messages.switchedToStatic'));
  }, [messageApi, svgTitles, clearTimelineData, setVisualizerState, t]);

  /** Apply dynamic mode: set timeline to sample (or empty if no region). */
  const applySwitchToDynamic = useCallback(() => {
    if (svgTitles.length > 0) {
      const samplePeriods = ['2020', '2021', '2022', '2023', '2024'];
      const timeline: Record<string, DataSet> = {};
      for (let p = 0; p < samplePeriods.length; p++) {
        const baseMultiplier = 1 + p * 0.3;
        const periodData = svgTitles.map((title, i) => ({
          id: title,
          label: title,
          value: Math.floor((100 + i * 50) * baseMultiplier + Math.random() * 200),
        }));
        timeline[samplePeriods[p]] = {
          allIds: periodData.map((item) => item.id),
          byId: Object.fromEntries(periodData.map((item) => [item.id, item])),
        };
      }
      setTimelineData(timeline, samplePeriods);
    } else {
      setTimelineData({}, []);
    }
    showMessageWithClose(messageApi, 'success', t('messages.switchedToDynamic'));
  }, [messageApi, svgTitles, setTimelineData, t]);

  const handleSwitchToStatic = useCallback(() => {
    if (hasHistoricalFormat && hasDataOrTimeline) {
      modal.confirm({
        title: t('messages.switchToStaticConfirm'),
        content: <SwitchModeConfirmContent />,
        okText: t('messages.switch'),
        cancelText: t('nav.cancel'),
        onOk: applySwitchToStatic,
      });
    } else {
      applySwitchToStatic();
    }
  }, [modal, hasHistoricalFormat, hasDataOrTimeline, applySwitchToStatic, t]);

  const handleSwitchToDynamic = useCallback(() => {
    if (hasDataOrTimeline) {
      modal.confirm({
        title: t('messages.switchToDynamicConfirm'),
        content: <SwitchModeConfirmContent />,
        okText: t('messages.switch'),
        cancelText: t('nav.cancel'),
        onOk: applySwitchToDynamic,
      });
    } else {
      applySwitchToDynamic();
    }
  }, [modal, hasDataOrTimeline, applySwitchToDynamic, t]);

  // Load SVG titles and generate sample data when region changes
  useEffect(() => {
    let cancelled = false;

    const loadSvgTitlesAndGenerateSampleData = async () => {
      if (!selectedCountryId) {
        setSvgTitles([]);
        setVisualizerState({ data: { allIds: [], byId: {} } });
        clearTimelineData();
        return;
      }

      try {
        const svgContent = await loadMapSvg(selectedCountryId);
        if (cancelled || useVisualizerStore.getState().selectedCountryId !== selectedCountryId) {
          return;
        }
        if (svgContent) {
          const titles = extractSvgTitles(svgContent);
          setSvgTitles(titles);

          // Generate sample: panel/dynamic if plan supports it, else static
          if (titles.length > 0) {
            if (limits.historicalDataImport) {
              const samplePeriods = ['2020', '2021', '2022', '2023', '2024'];
              const timeline: Record<string, DataSet> = {};
              for (let p = 0; p < samplePeriods.length; p++) {
                const baseMultiplier = 1 + p * 0.3;
                const periodData = titles.map((title, i) => ({
                  id: title,
                  label: title,
                  value: Math.floor((100 + i * 50) * baseMultiplier + Math.random() * 200),
                }));
                timeline[samplePeriods[p]] = {
                  allIds: periodData.map((item) => item.id),
                  byId: Object.fromEntries(periodData.map((item) => [item.id, item])),
                };
              }
              setTimelineData(timeline, samplePeriods);
            } else {
              const sampleData = titles.map((title) => ({
                id: title,
                label: title,
                value: Math.floor(Math.random() * 900) + 100,
              }));
              const allIds = sampleData.map((item) => item.id);
              const byId = Object.fromEntries(sampleData.map((item) => [item.id, item]));
              clearTimelineData();
              setVisualizerState({ data: { allIds, byId } });
            }
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
  }, [
    selectedCountryId,
    setVisualizerState,
    clearTimelineData,
    setTimelineData,
    limits.historicalDataImport,
  ]);

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
        showMessageWithClose(
          messageApi,
          'success',
          t('messages.importedRowsPeriods', { count: parsed.length, periods: periodOrder.length }),
        );
        onSuccess?.(timeline);
      } else {
        if (hasTimePeriods && !limits.historicalDataImport) {
          showMessageWithClose(messageApi, 'info', t('messages.timeSeriesDetected'));
        }
        if (limits.historicalDataImport) {
          showMessageWithClose(messageApi, 'warning', t('messages.noTimeColumnDetected'));
        }
        const regionData = convertToRegionData(parsed, svgTitles);
        clearTimelineData();
        setVisualizerState({ data: regionData });
        showMessageWithClose(
          messageApi,
          'success',
          t('messages.importedRegions', { count: parsed.length }),
        );
        onSuccess?.(regionData);
      }
    },
    [
      messageApi,
      limits.historicalDataImport,
      svgTitles,
      setVisualizerState,
      setTimelineData,
      clearTimelineData,
      t,
    ],
  );

  const handleSheetCsvFetched = useCallback(
    (payload: { csv: string; url: string }) => {
      const { csv, url } = payload;
      const gid = extractGid(url);
      setVisualizerState({
        google: { url, gid: gid ?? null },
      });
      const result = parseCSV(csv);
      if (typeof result === 'object' && 'error' in result) {
        showMessageWithSampleDownload(
          messageApi,
          'error',
          t('messages.datasetMustIncludeId'),
          handleDownloadSampleOnly,
          { downloadLabel: t('messages.downloadSample') },
        );
        return;
      }
      if (result.length === 0) {
        showMessageWithSampleDownload(
          messageApi,
          'error',
          t('messages.dataFormatMismatch'),
          handleDownloadSampleOnly,
          { downloadLabel: t('messages.downloadSample') },
        );
        return;
      }
      processImportedData(result);
    },
    [messageApi, processImportedData, handleDownloadSampleOnly, setVisualizerState, t],
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
              showMessageWithClose(messageApi, 'warning', t('messages.noValidDataExcel'));
              onError?.(new Error('No valid data found'));
              return;
            }

            processImportedData(parsed, onSuccess);
          } catch (error) {
            showMessageWithSampleDownload(
              messageApi,
              'error',
              t('messages.failedParseExcel'),
              handleDownloadSampleOnly,
              { downloadLabel: t('messages.downloadSample') },
            );
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
            const result = parseCSV(content);
            if (typeof result === 'object' && 'error' in result) {
              showMessageWithSampleDownload(
                messageApi,
                'error',
                t('messages.datasetMustIncludeId'),
                handleDownloadSampleOnly,
                { downloadLabel: t('messages.downloadSample') },
              );
              onError?.(new Error('Missing id column'));
              return;
            }
            parsed = result;
          } else if (importDataType === 'json') {
            parsed = parseJSON(content);
          }

          if (parsed.length === 0) {
            showMessageWithClose(messageApi, 'warning', t('messages.noValidDataFile'));
            onError?.(new Error('No valid data found'));
            return;
          }

          processImportedData(parsed, onSuccess);
        } catch (error) {
          showMessageWithSampleDownload(
            messageApi,
            'error',
            t('messages.failedParseFile'),
            handleDownloadSampleOnly,
            { downloadLabel: t('messages.downloadSample') },
          );
          onError?.(error as Error);
        }
      };

      reader.onerror = () => {
        onError?.(new Error('Failed to read file'));
      };

      reader.readAsText(file as File);
    },
    [messageApi, importDataType, processImportedData, handleDownloadSampleOnly, t],
  );

  const importActionComponents: Record<ImportDataType, JSX.Element> = useMemo(
    () => ({
      manual: (
        <Tooltip
          title={
            selectedCountryId
              ? t('visualizer.importData.manualTooltip')
              : t('visualizer.importData.manualTooltipNoRegion')
          }
        >
          <span>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsManualModalOpen(true)}
              disabled={!selectedCountryId}
            >
              {t('visualizer.importData.enterManually')}
            </Button>
          </span>
        </Tooltip>
      ),
      sheets: (
        <Flex>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => setIsSheetsModalOpen(true)}
          >
            {t('visualizer.importData.connectSheets')}
          </Button>
        </Flex>
      ),
      csv: (
        <Upload accept=".csv" customRequest={handleFileUpload} showUploadList={false} maxCount={1}>
          <Button type="primary" icon={<CloudUploadOutlined />}>
            {t('visualizer.importData.chooseCsv')}
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
            {t('visualizer.importData.chooseExcel')}
          </Button>
        </Upload>
      ),
      json: (
        <Upload accept=".json" customRequest={handleFileUpload} showUploadList={false} maxCount={1}>
          <Button type="primary" icon={<CloudUploadOutlined />} block>
            {t('visualizer.importData.chooseJson')}
          </Button>
        </Upload>
      ),
    }),
    [handleFileUpload, selectedCountryId, t],
  );

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <SectionTitle IconComponent={FileExcelOutlined}>
          {t('visualizer.importData.sectionTitle')}
        </SectionTitle>
        <Flex gap={4} align="center">
          <Tooltip
            title={
              data.allIds.length === 0
                ? t('visualizer.importData.downloadTooltipEmpty')
                : t('visualizer.importData.downloadTooltip')
            }
          >
            <Button
              type="text"
              icon={isDownloading ? <LoadingOutlined /> : <DownloadOutlined />}
              size="small"
              onClick={handleDownloadData}
              className="text-gray-500"
              disabled={data.allIds.length === 0 || isDownloading}
              loading={isDownloading}
              aria-label={t('visualizer.importData.downloadAria')}
            />
          </Tooltip>

          <Tooltip
            title={
              selectedCountryId
                ? t('visualizer.importData.manualTooltip')
                : t('visualizer.importData.manualTooltipNoRegion')
            }
          >
            <span>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => setIsManualModalOpen(true)}
                className="text-gray-500"
                disabled={!selectedCountryId}
                aria-label={t('visualizer.importData.manualAria')}
              />
            </span>
          </Tooltip>
          {limits.historicalDataImport && (
            <Tooltip
              title={
                selectedCountryId
                  ? hasHistoricalFormat
                    ? t('visualizer.importData.switchToStatic')
                    : t('visualizer.importData.switchToDynamic')
                  : t('visualizer.importData.selectRegionFirst')
              }
            >
              <span>
                <Button
                  type="text"
                  icon={<SwapOutlined />}
                  size="small"
                  disabled={!selectedCountryId}
                  onClick={hasHistoricalFormat ? handleSwitchToStatic : handleSwitchToDynamic}
                  className="text-gray-500"
                  aria-label={
                    hasHistoricalFormat
                      ? t('visualizer.importData.switchAriaToStatic')
                      : t('visualizer.importData.switchAriaToDynamic')
                  }
                />
              </span>
            </Tooltip>
          )}
          <Tooltip title={<ImportFormatInfoTooltip />} placement="bottom">
            <InfoCircleOutlined className="cursor-help text-gray-400" />
          </Tooltip>
        </Flex>
      </Flex>

      <Segmented
        options={importFormatOptions}
        value={importDataType}
        onChange={(value: string | number) => {
          const next = value as ImportDataType;
          setVisualizerState({
            importDataType: next,
            ...(next !== IMPORT_DATA_TYPES.sheets ? { google: { url: null, gid: null } } : {}),
          });
        }}
        block
        aria-label={t('visualizer.importData.segmentedAria')}
      />

      <Flex gap="small" align="center" wrap="wrap" className="text-sm text-gray-500">
        <Typography.Text className="text-sm text-gray-500">
          {t('visualizer.importData.regionIdsNote')}
          <br />
          <Tooltip
            title={
              !selectedCountryId ? t('visualizer.importData.downloadTooltipNoRegion') : undefined
            }
          >
            <span>
              <Button
                type="text"
                size="small"
                icon={isDownloadingSample ? <LoadingOutlined /> : null}
                onClick={handleDownloadSampleOnly}
                disabled={!selectedCountryId || svgTitles.length === 0 || isDownloadingSample}
                loading={isDownloadingSample}
                className="h-auto p-0! font-medium!"
                aria-label={t('messages.downloadSample')}
              >
                {!isDownloadingSample && t('visualizer.importData.downloadLink')}
              </Button>
            </span>
          </Tooltip>{' '}
          {t('visualizer.importData.sampleNoteSuffix')}
        </Typography.Text>
      </Flex>

      {importActionComponents[importDataType]}

      <Flex vertical gap="small" className="p-sm! min-w-0 rounded-md bg-gray-50">
        <Typography.Text className="text-xs font-semibold text-gray-500">
          {t('visualizer.importData.expectedFormat')}
        </Typography.Text>
        <ImportFormatExamples
          importDataType={importDataType}
          hasHistoricalFormat={hasHistoricalFormat}
        />
      </Flex>

      {isManualModalOpen && (
        <Suspense fallback={<Spin />}>
          <ManualDataEntryModal
            open={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            mapRegionIds={svgTitles}
            historicalDataImport={limits.historicalDataImport}
          />
        </Suspense>
      )}

      {isSheetsModalOpen && (
        <Suspense fallback={<Spin />}>
          <GoogleSheetsModal
            open={isSheetsModalOpen}
            onClose={() => setIsSheetsModalOpen(false)}
            onCsvFetched={handleSheetCsvFetched}
          />
        </Suspense>
      )}
    </Flex>
  );
};

export default ImportDataPanel;
