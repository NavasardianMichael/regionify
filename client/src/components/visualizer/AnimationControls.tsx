import { type FC, useCallback, useEffect, useRef } from 'react';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { Button, Flex, Select, Slider, Switch, Typography } from 'antd';
import {
  selectIsPlaying,
  selectPause,
  selectSetSpeed,
  selectSetTransitionType,
  selectSpeed,
  selectTogglePlay,
  selectTransitionType,
} from '@/store/animation/selectors';
import { useAnimationStore } from '@/store/animation/store';
import {
  selectActiveTimePeriod,
  selectSetActiveTimePeriod,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
];

const AnimationControls: FC = () => {
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const activeTimePeriod = useVisualizerStore(selectActiveTimePeriod);
  const timelineData = useVisualizerStore(selectTimelineData);
  const setActiveTimePeriod = useVisualizerStore(selectSetActiveTimePeriod);

  const isPlaying = useAnimationStore(selectIsPlaying);
  const speed = useAnimationStore(selectSpeed);
  const transitionType = useAnimationStore(selectTransitionType);
  const togglePlay = useAnimationStore(selectTogglePlay);
  const pause = useAnimationStore(selectPause);
  const setSpeed = useAnimationStore(selectSetSpeed);
  const setTransitionType = useAnimationStore(selectSetTransitionType);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentIndex = timePeriods.indexOf(activeTimePeriod ?? '');
  const isFirstPeriod = currentIndex <= 0;
  const isLastPeriod = currentIndex >= timePeriods.length - 1;

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying || timePeriods.length < 2) return;

    intervalRef.current = setInterval(() => {
      const state = useVisualizerStore.getState();
      const currentPeriod = state.activeTimePeriod;
      const periods = state.timePeriods;
      const idx = periods.indexOf(currentPeriod ?? '');
      const nextIdx = idx >= periods.length - 1 ? 0 : idx + 1;
      state.setActiveTimePeriod(periods[nextIdx]);
    }, 1000 / speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, timePeriods.length]);

  const handleStepBackward = useCallback(() => {
    pause();
    if (currentIndex > 0) {
      setActiveTimePeriod(timePeriods[currentIndex - 1]);
    }
  }, [currentIndex, timePeriods, setActiveTimePeriod, pause]);

  const handleStepForward = useCallback(() => {
    pause();
    if (currentIndex < timePeriods.length - 1) {
      setActiveTimePeriod(timePeriods[currentIndex + 1]);
    }
  }, [currentIndex, timePeriods, setActiveTimePeriod, pause]);

  const handleSliderChange = useCallback(
    (value: number) => {
      pause();
      if (timePeriods[value]) {
        setActiveTimePeriod(timePeriods[value]);
      }
    },
    [timePeriods, setActiveTimePeriod, pause],
  );

  const handleSpeedChange = useCallback(
    (value: number) => {
      setSpeed(value);
    },
    [setSpeed],
  );

  const handleTransitionToggle = useCallback(
    (checked: boolean) => {
      setTransitionType(checked ? 'smooth' : 'instant');
    },
    [setTransitionType],
  );

  const sliderMarks = timePeriods.reduce<Record<number, string>>((acc, period, index) => {
    if (
      index === 0 ||
      index === timePeriods.length - 1 ||
      timePeriods.length <= 10 ||
      (timePeriods.length > 10 && index % Math.ceil(timePeriods.length / 8) === 0)
    ) {
      acc[index] = period;
    }
    return acc;
  }, {});

  if (timePeriods.length < 2 || Object.keys(timelineData).length === 0) {
    return null;
  }

  return (
    <Flex vertical gap="small" className="p-md! rounded-lg border border-gray-200 bg-gray-50">
      <Flex align="center" justify="space-between" wrap="wrap" gap="small">
        <Flex align="center" gap="small">
          <Button
            type="text"
            icon={<StepBackwardOutlined />}
            onClick={handleStepBackward}
            disabled={isFirstPeriod}
            size="small"
            aria-label="Previous period"
          />
          <Button
            type="primary"
            shape="circle"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          />
          <Button
            type="text"
            icon={<StepForwardOutlined />}
            onClick={handleStepForward}
            disabled={isLastPeriod}
            size="small"
            aria-label="Next period"
          />
          <Typography.Text strong className="ml-2 text-sm">
            {activeTimePeriod ?? timePeriods[0]}
          </Typography.Text>
        </Flex>

        <Flex align="center" gap="middle">
          <Flex align="center" gap={4}>
            <Typography.Text className="text-xs text-gray-500">Speed:</Typography.Text>
            <Select
              value={speed}
              onChange={handleSpeedChange}
              options={SPEED_OPTIONS}
              size="small"
              className="w-18"
            />
          </Flex>
          <Flex align="center" gap={4}>
            <Typography.Text className="text-xs text-gray-500">Smooth:</Typography.Text>
            <Switch
              size="small"
              checked={transitionType === 'smooth'}
              onChange={handleTransitionToggle}
            />
          </Flex>
        </Flex>
      </Flex>

      <Slider
        min={0}
        max={timePeriods.length - 1}
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={handleSliderChange}
        marks={sliderMarks}
        tooltip={{
          formatter: (value: number | undefined) =>
            value !== undefined ? (timePeriods[value] ?? '') : '',
        }}
      />
    </Flex>
  );
};

export default AnimationControls;
