import { type FC, useCallback, useMemo, useRef } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Flex, type RefSelectProps, Select, type SelectProps } from 'antd';
import {
  selectSelectedJurisdictionId,
  selectSetVisualizerState,
  useVisualizerStore,
} from '@/store/mapData/store';
import { JURISDICTION_OPTIONS } from '@/constants/jurisdictions';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

export const JurisdictionSelect: FC = () => {
  const selectRef = useRef<RefSelectProps>(null);

  const selectedJurisdictionId = useVisualizerStore(selectSelectedJurisdictionId);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  const handleJurisdictionChange: SelectProps['onChange'] = useCallback(
    (selectedJurisdictionId) => {
      setVisualizerState({ selectedJurisdictionId });
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
      <SectionTitle IconComponent={GlobalOutlined}>Select Jurisdiction</SectionTitle>
      <Select
        ref={selectRef}
        value={selectedJurisdictionId}
        onChange={handleJurisdictionChange}
        options={JURISDICTION_OPTIONS}
        placeholder="Select a region..."
        className="w-full"
        size="large"
        showSearch={showSearchConfig}
      />
    </Flex>
  );
};

export default JurisdictionSelect;
