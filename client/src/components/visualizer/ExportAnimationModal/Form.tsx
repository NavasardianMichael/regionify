import { type FC } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { EXPORT_TYPES } from '@regionify/shared';
import { Button, Flex, InputNumber, Progress, Select, Slider, Switch, Typography } from 'antd';
import { getAnimationTotalFrames } from '@/helpers/animationExport';

const EXPORT_FPS = 30;

type AnimationFormat = typeof EXPORT_TYPES.gif | typeof EXPORT_TYPES.mp4;

type FormatOption = { value: AnimationFormat; label: string };

export type FormProps = {
  format: AnimationFormat;
  quality: number;
  maxExportQuality: number;
  secondsPerPeriod: number;
  smoothTransitions: boolean;
  isExporting: boolean;
  progress: number;
  timePeriodsCount: number;
  allowedFormats: FormatOption[];
  onFormatChange: (value: AnimationFormat) => void;
  onQualityChange: (value: number | null) => void;
  onSecondsPerPeriodChange: (value: number | null) => void;
  onSmoothTransitionsChange: (checked: boolean) => void;
  onExport: () => void;
};

export const Form: FC<FormProps> = ({
  format,
  quality,
  maxExportQuality,
  secondsPerPeriod,
  smoothTransitions,
  isExporting,
  progress,
  timePeriodsCount,
  allowedFormats,
  onFormatChange,
  onQualityChange,
  onSecondsPerPeriodChange,
  onSmoothTransitionsChange,
  onExport,
}) => (
  <Flex vertical gap="middle" className="min-w-0 px-1 py-2">
    <Flex vertical gap="small">
      <Typography.Text className="text-sm text-gray-600">Format:</Typography.Text>
      <Select
        value={format}
        onChange={onFormatChange}
        options={allowedFormats}
        className="w-full"
        disabled={isExporting}
      />
    </Flex>

    <Flex vertical gap="small" className="min-w-0">
      <Flex align="center" justify="space-between" gap="small" className="min-w-0">
        <Typography.Text className="min-w-0 flex-1 text-sm text-gray-600">
          Quality (%):
        </Typography.Text>
        <InputNumber
          min={1}
          max={maxExportQuality}
          value={quality}
          onChange={onQualityChange}
          className="w-20 shrink-0"
          disabled={isExporting}
        />
      </Flex>
      <div className="min-w-0 px-2.5">
        <Slider
          min={1}
          max={maxExportQuality}
          value={Math.min(quality, maxExportQuality)}
          onChange={(v: number) => onQualityChange(Math.min(v, maxExportQuality))}
          disabled={isExporting}
          styles={{ root: { marginInline: 0, width: '100%' } }}
        />
      </div>
    </Flex>

    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600">
          Seconds per time period:
        </Typography.Text>
        <InputNumber
          min={0.5}
          max={10}
          step={0.5}
          value={secondsPerPeriod}
          onChange={onSecondsPerPeriodChange}
          className="w-20"
          disabled={isExporting}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600">Smooth transitions:</Typography.Text>
        <Switch
          checked={smoothTransitions}
          onChange={onSmoothTransitionsChange}
          aria-label="Smooth transitions between time periods"
          disabled={isExporting}
        />
      </Flex>
      <Typography.Text type="secondary" className="text-xs">
        {getAnimationTotalFrames(timePeriodsCount, {
          secondsPerPeriod,
          fps: EXPORT_FPS,
          smooth: smoothTransitions,
        })}{' '}
        frames · ~{(timePeriodsCount * secondsPerPeriod).toFixed(1)}s duration
      </Typography.Text>
    </Flex>

    {isExporting && (
      <Progress percent={Math.round(progress * 100)} status="active" strokeColor="#18294D" />
    )}

    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={onExport}
      loading={isExporting}
      disabled={isExporting || timePeriodsCount < 2}
      block
    >
      {isExporting ? 'Exporting...' : `Export ${format === EXPORT_TYPES.gif ? 'GIF' : 'Video'}`}
    </Button>
  </Flex>
);
