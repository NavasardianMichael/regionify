import { type FC, useCallback, useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { PLANS } from '@regionify/shared';
import { Button, Flex, InputNumber, message, Modal, Select, Slider, Typography } from 'antd';
import { selectSelectedRegionId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { type ExportType } from '@/types/exportTypes';
import { EXPORT_TYPES } from '@/constants/exportTypes';
import { PLAN_FEATURE_LIMITS } from '@/constants/plans';
import { ROUTES } from '@/constants/routes';
import { exportMapAsJpeg, exportMapAsPng, exportMapAsSvg } from '@/helpers/mapExport';
import { AppNavLink } from '@/components/ui/AppNavLink';

type ExportTypeOption = {
  value: ExportType;
  label: string;
};

const ALL_EXPORT_OPTIONS: ExportTypeOption[] = [
  { value: EXPORT_TYPES.png, label: 'PNG' },
  { value: EXPORT_TYPES.svg, label: 'SVG' },
  { value: EXPORT_TYPES.jpeg, label: 'JPEG' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

const DEFAULT_QUALITY = 60;

const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.free;
  const limits = PLAN_FEATURE_LIMITS[plan];
  const maxQuality = limits.maxExportQuality;
  const initialQuality = Math.min(DEFAULT_QUALITY, maxQuality);
  const allowedFormats = limits.allowedExportFormats;
  const exportTypeOptions = useMemo(
    () => ALL_EXPORT_OPTIONS.filter((o) => allowedFormats.includes(o.value)),
    [allowedFormats],
  );
  const defaultExportType = (allowedFormats[0] ?? EXPORT_TYPES.png) as ExportType;

  const [exportType, setExportType] = useState<ExportType>(defaultExportType);
  const [quality, setQuality] = useState(initialQuality);
  const [isExporting, setIsExporting] = useState(false);

  const handleAfterOpenChange = useCallback(
    (visible: boolean) => {
      if (visible) {
        setExportType(defaultExportType);
        setQuality(Math.min(DEFAULT_QUALITY, maxQuality));
      }
    },
    [defaultExportType, maxQuality],
  );

  const handleExportTypeChange = useCallback((value: ExportType) => {
    setExportType(value);
  }, []);

  const handleQualityChange = useCallback(
    (value: number | null) => {
      const v = value ?? initialQuality;
      setQuality(Math.min(v, maxQuality));
    },
    [initialQuality, maxQuality],
  );

  const exportHandlers = useMemo(
    () => ({
      [EXPORT_TYPES.svg]: (fileName: string) => exportMapAsSvg(fileName),
      [EXPORT_TYPES.png]: (fileName: string) => {
        if (plan === PLANS.free) {
          return exportMapAsPng(quality, fileName, {
            backgroundColor: '#f5f5f5',
            watermark: 'Regionify',
          });
        }
        return exportMapAsPng(quality, fileName);
      },
      [EXPORT_TYPES.jpeg]: (fileName: string) => {
        if (plan === PLANS.free) {
          return exportMapAsJpeg(quality, fileName, {
            backgroundColor: '#f5f5f5',
            watermark: 'Regionify',
          });
        }
        return exportMapAsJpeg(quality, fileName);
      },
    }),
    [quality, plan],
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
        {/* Export Type — Free: PNG only; Explorer/Atlas: PNG, SVG, JPEG */}
        <Flex vertical gap="small">
          <Typography.Text className="text-sm text-gray-600">Export type:</Typography.Text>
          <Select
            value={exportType}
            onChange={handleExportTypeChange}
            options={exportTypeOptions}
            className="w-full"
          />
          {allowedFormats.length === 1 && (
            <Typography.Text type="secondary" className="text-xs">
              Free plan: PNG only.{' '}
              <AppNavLink to={ROUTES.BILLING} className="text-primary! font-semibold">
                Upgrade
              </AppNavLink>{' '}
              for SVG and JPEG.
            </Typography.Text>
          )}
        </Flex>

        {/* Quality Control */}
        {showQualityControl && (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Quality (%):</Typography.Text>
              <InputNumber
                min={1}
                max={maxQuality}
                value={quality}
                onChange={handleQualityChange}
                className="w-20"
                disabled={plan === PLANS.free}
              />
            </Flex>
            <Slider
              min={1}
              max={100}
              value={quality}
              onChange={(v) =>
                setQuality(typeof v === 'number' ? Math.min(v, maxQuality) : maxQuality)
              }
              aria-label="Export quality"
              disabled={plan === PLANS.free}
            />
            {limits.pictureQualityLimit && (
              <Typography.Text type="secondary" className="text-xs">
                Free plan: quality limited to {maxQuality}%.{' '}
                <AppNavLink to="/billing" className="text-primary! font-semibold">
                  Upgrade
                </AppNavLink>{' '}
                for 100%.
              </Typography.Text>
            )}
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
