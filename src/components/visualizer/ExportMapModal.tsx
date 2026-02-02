import { type FC, useCallback, useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, InputNumber, Modal, Select, Slider, Typography } from 'antd';

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
  const [exportType, setExportType] = useState<ExportType>(EXPORT_TYPES.png);
  const [quality, setQuality] = useState(60);

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

  const handleDownload = useCallback(() => {
    // TODO: Implement export functionality
    console.log('Exporting as', exportType, 'with quality', quality);
    onClose();
  }, [exportType, quality, onClose]);

  const showQualityControl = useMemo(() => {
    return exportType === EXPORT_TYPES.png || exportType === EXPORT_TYPES.jpeg;
  }, [exportType]);

  const downloadButtonLabel = useMemo(() => {
    return `Download ${exportType.toUpperCase()}`;
  }, [exportType]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small">
          <DownloadOutlined className="text-primary" />
          <Typography.Text className="text-lg font-semibold">Export Map Visualizer</Typography.Text>
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
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} size="large">
          {downloadButtonLabel}
        </Button>
      </Flex>
    </Modal>
  );
};

export default ExportMapModal;
