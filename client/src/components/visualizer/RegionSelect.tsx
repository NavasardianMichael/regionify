import { type FC, useCallback, useMemo, useRef } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Flex, Modal, type RefSelectProps, Select, type SelectProps, Typography } from 'antd';
import {
  selectData,
  selectSelectedRegionId,
  selectSetVisualizerState,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { useHasUnsavedChanges } from '@/hooks/useProjectState';
import type { RegionId } from '@/types/mapData';
import { REGION_OPTIONS } from '@/constants/regions';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

export const RegionSelect: FC = () => {
  const selectRef = useRef<RefSelectProps>(null);

  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const data = useVisualizerStore(selectData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const hasUnsavedChanges = useHasUnsavedChanges();

  const hasDataOrTimeline = data.allIds.length > 0 || timePeriods.length > 0;
  const shouldWarnOnRegionChange = hasUnsavedChanges || hasDataOrTimeline;

  const handleRegionChange: SelectProps['onChange'] = useCallback(
    (newRegionId: RegionId) => {
      if (newRegionId === selectedRegionId) return;

      const doChange = () => {
        setVisualizerState({ selectedRegionId: newRegionId });
        selectRef.current?.blur();
      };

      if (shouldWarnOnRegionChange) {
        Modal.confirm({
          title: 'Change region?',
          content: (
            <Flex vertical gap="small">
              <Typography.Text>
                All unsaved changes and current dataset will be lost. Are you sure?
              </Typography.Text>
              <Typography.Text type="secondary" className="text-xs">
                We recommend saving your current project first, then creating a new one if you need
                to keep this data.
              </Typography.Text>
            </Flex>
          ),
          okText: 'Change region',
          cancelText: 'Cancel',
          onOk: doChange,
        });
      } else {
        doChange();
      }
    },
    [selectedRegionId, setVisualizerState, shouldWarnOnRegionChange],
  );

  const showSearchConfig = useMemo<SelectProps['showSearch']>(
    () => ({
      filterOption: (input, option) =>
        (option?.label as string).toLowerCase().includes(input.toLowerCase()),
    }),
    [],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={GlobalOutlined}>Select Region</SectionTitle>
      <Select
        ref={selectRef}
        value={selectedRegionId}
        onChange={handleRegionChange}
        options={REGION_OPTIONS}
        placeholder="Select a region..."
        className="max-w-64!"
        showSearch={showSearchConfig}
        aria-label="Select a region"
      />
    </Flex>
  );
};

export default RegionSelect;
