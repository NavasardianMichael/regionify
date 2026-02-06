import { type FC, useCallback, useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, InputNumber, message, Modal, Select, Slider, Typography } from 'antd';
import { selectSelectedRegionId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { exportMapAsJpeg, exportMapAsPng, exportMapAsSvg } from '@/helpers/mapExport';

const EXPORT_TYPES = {
  png: 'png',
  svg: 'svg',
  jpeg: 'jpeg',
} as const;

type ExportType = (typeof EXPORT_TYPES)[keyof typeof EXPORT_TYPES];

type ExportTypeOption = {
  value: ExportType;
  label: string;
};

const EXPORT_TYPE_OPTIONS: ExportTypeOption[] = [
  { value: EXPORT_TYPES.png, label: 'PNG' },
  { value: EXPORT_TYPES.svg, label: 'SVG' },
  { value: EXPORT_TYPES.jpeg, label: 'JPEG' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const [exportType, setExportType] = useState<ExportType>(EXPORT_TYPES.png);
  const [quality, setQuality] = useState(60);
  const [isExporting, setIsExporting] = useState(false);

  const handleAfterOpenChange = useCallback((visible: boolean) => {
    if (visible) {
      setExportType(EXPORT_TYPES.png);
      setQuality(60);
    }
  }, []);

  const handleExportTypeChange = useCallback((value: ExportType) => {
    setExportType(value);
  }, []);

  const handleQualityChange = useCallback((value: number | null) => {
    setQuality(value ?? 60);
  }, []);

  const exportHandlers = useMemo(
    () => ({
      [EXPORT_TYPES.svg]: (fileName: string) => exportMapAsSvg(fileName),
      [EXPORT_TYPES.png]: (fileName: string) => exportMapAsPng(quality, fileName),
      [EXPORT_TYPES.jpeg]: (fileName: string) => exportMapAsJpeg(quality, fileName),
    }),
    [quality],
  );

  const handleDownload = useCallback(async () => {
    const fileName = selectedRegionId ? `regionify-${selectedRegionId}` : 'regionify-map';

    setIsExporting(true);
    try {
      await exportHandlers[exportType](fileName);
      message.success(`Map exported as ${exportType.toUpperCase()}`);
      onClose();
    } catch {
      message.error('Failed to export map. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [exportType, exportHandlers, selectedRegionId, onClose]);

  const showQualityControl = useMemo(() => {
    return exportType === EXPORT_TYPES.png || exportType === EXPORT_TYPES.jpeg;
  }, [exportType]);

  const downloadButtonLabel = useMemo(() => {
    return `Download ${exportType.toUpperCase()}`;
  }, [exportType]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-6!">
          <DownloadOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            Export Map Visualizer
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      afterOpenChange={handleAfterOpenChange}
      footer={null}
      width={400}
      destroyOnHidden
    >
      <Flex vertical gap="middle" className="py-md">
        {/* Export Type */}
        <Flex vertical gap="small">
          <Typography.Text className="text-sm text-gray-600">Export type:</Typography.Text>
          <Select
            value={exportType}
            onChange={handleExportTypeChange}
            options={EXPORT_TYPE_OPTIONS}
            className="w-full"
          />
        </Flex>

        {/* Quality Control */}
        {showQualityControl && (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Quality (%):</Typography.Text>
              <InputNumber
                min={1}
                max={100}
                value={quality}
                onChange={handleQualityChange}
                className="w-20"
              />
            </Flex>
            <Slider
              min={1}
              max={100}
              value={quality}
              onChange={setQuality}
              aria-label="Export quality"
            />
          </Flex>
        )}

        {/* Download Button */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={isExporting}
          disabled={!selectedRegionId}
          size="large"
        >
          {downloadButtonLabel}
        </Button>
      </Flex>
    </Modal>
  );
};

export default ExportMapModal;
