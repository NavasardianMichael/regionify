import { type FC, startTransition, useCallback, useMemo, useRef } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Flex, type RefSelectProps, Select, type SelectProps } from 'antd';
import {
  selectData,
  selectSelectedCountryId,
  selectSetVisualizerState,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { useHasUnsavedChanges } from '@/hooks/useProjectState';
import type { RegionId } from '@/types/mapData';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { getLocalizedRegionSelectOptions } from '@/helpers/regionDisplay';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

export const RegionSelect: FC = () => {
  const { t, i18n } = useTypedTranslation();
  const { modal } = useAppFeedback();
  const selectRef = useRef<RefSelectProps>(null);

  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const data = useVisualizerStore(selectData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const hasUnsavedChanges = useHasUnsavedChanges();

  const hasDataOrTimeline = data.allIds.length > 0 || timePeriods.length > 0;
  const shouldWarnOnCountryChange = hasUnsavedChanges || hasDataOrTimeline;

  const handleCountryChange: SelectProps['onChange'] = useCallback(
    (newCountryId: RegionId) => {
      if (newCountryId === selectedCountryId) return;

      const doChange = () => {
        startTransition(() => {
          setVisualizerState({ selectedCountryId: newCountryId });
        });
        selectRef.current?.blur();
      };

      if (shouldWarnOnCountryChange) {
        modal.confirm({
          title: t('visualizer.region.changeConfirmTitle'),
          content: t('visualizer.region.changeConfirmBody'),
          okText: t('visualizer.region.changeOk'),
          cancelText: t('nav.cancel'),
          onOk: doChange,
        });
      } else {
        doChange();
      }
    },
    [modal, selectedCountryId, setVisualizerState, shouldWarnOnCountryChange, t],
  );

  const regionOptions = useMemo(
    () => getLocalizedRegionSelectOptions(i18n.resolvedLanguage ?? i18n.language),
    [i18n.language, i18n.resolvedLanguage],
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
      <SectionTitle IconComponent={GlobalOutlined}>
        {t('visualizer.region.sectionTitle')}
      </SectionTitle>
      <Select
        ref={selectRef}
        value={selectedCountryId}
        onChange={handleCountryChange}
        options={regionOptions}
        placeholder={t('visualizer.region.placeholder')}
        className="max-w-64!"
        showSearch={showSearchConfig}
        aria-label={t('visualizer.region.ariaLabel')}
      />
    </Flex>
  );
};

export default RegionSelect;
