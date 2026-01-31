import { type FC, useCallback, useMemo, useRef } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Flex, type RefSelectProps, Select, type SelectProps } from 'antd';
import { selectSelectedRegionId, selectSetVisualizerState } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { REGION_OPTIONS } from '@/constants/regions';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

export const RegionSelect: FC = () => {
  const selectRef = useRef<RefSelectProps>(null);

  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  const handleRegionChange: SelectProps['onChange'] = useCallback(
    (selectedRegionId) => {
      setVisualizerState({ selectedRegionId });
      selectRef.current?.blur();
    },
    [setVisualizerState],
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
      />
    </Flex>
  );
};

export default RegionSelect;
