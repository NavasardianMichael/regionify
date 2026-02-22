import { type FC } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { EXPORT_TYPES } from '@regionify/shared';
import { Button, Flex, InputNumber, Progress, Select, Slider, Switch, Typography } from 'antd';
import { getAnimationTotalFrames } from '@/helpers/animationExport';

const EXPORT_FPS = 30;

type AnimationFormat = typeof EXPORT_TYPES.gif | typeof EXPORT_TYPES.mp4;

type FormatOption = { value: AnimationFormat; label: string };

export type ExportAnimationModalFormProps = {
  format: AnimationFormat;
  quality: number;
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

export const ExportAnimationModalForm: FC<ExportAnimationModalFormProps> = ({
  format,
  quality,
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
  <Flex vertical gap="middle" className="py-2">
    <Flex vertical gap="small">
      <Typography.Text className="text-sm text-gray-600">Format:</Typography.Text>
      <Select
        value={format}
        onChange={onFormatChange}
        options={allowedFormats}
        className="w-full"
      />
    </Flex>

    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600">Quality (%):</Typography.Text>
        <InputNumber
          min={25}
          max={100}
          value={quality}
          onChange={onQualityChange}
          className="w-20"
        />
      </Flex>
      <Slider min={25} max={100} value={quality} onChange={(v: number) => onQualityChange(v)} />
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
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600">Smooth transitions:</Typography.Text>
        <Switch
          checked={smoothTransitions}
          onChange={onSmoothTransitionsChange}
          aria-label="Smooth transitions between time periods"
        />
      </Flex>
      <Typography.Text type="secondary" className="text-xs">
        {getAnimationTotalFrames(timePeriodsCount, {
          secondsPerPeriod,
          fps: EXPORT_FPS,
          smooth: smoothTransitions,
        })}{' '}
        frames · {EXPORT_FPS} FPS · ~
        {(
          getAnimationTotalFrames(timePeriodsCount, {
            secondsPerPeriod,
            fps: EXPORT_FPS,
            smooth: smoothTransitions,
          }) / EXPORT_FPS
        ).toFixed(1)}
        s duration
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
      disabled={timePeriodsCount < 2}
      block
    >
      {isExporting ? 'Exporting...' : `Export ${format === EXPORT_TYPES.gif ? 'GIF' : 'Video'}`}
    </Button>
  </Flex>
);
