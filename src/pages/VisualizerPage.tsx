import { type FC, lazy, Suspense, useMemo, useRef, useState } from 'react';
import { GlobalOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Flex,
  type RefSelectProps,
  Select,
  type SelectProps,
  Spin,
  Typography,
} from 'antd';
import { useVisualizerStore } from '@/store/mapData/store';
import { JURISDICTION_OPTIONS } from '@/constants/jurisdictions';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { CardLayout } from '@/components/visualizer/CardLayout';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const SIDEBAR_WIDTH = 'w-90';
const SIDEBAR_WIDTH_PX = 360; // 90 * 4 = 360px

const ImportDataPanel = lazy(() => import('@/components/visualizer/ImportDataPanel'));
const LegendConfigPanel = lazy(() => import('@/components/visualizer/LegendConfigPanel'));
const LegendStylesPanel = lazy(() => import('@/components/visualizer/LegendStylesPanel'));
const MapStylesPanel = lazy(() => import('@/components/visualizer/MapStylesPanel'));
const MapViewer = lazy(() => import('@/components/visualizer/MapViewer'));

const VisualizerPage: FC = () => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const selectRef = useRef<RefSelectProps>(null);

  const selectedJurisdictionId = useVisualizerStore((state) => state.selectedJurisdictionId);
  const setVisualizerState = useVisualizerStore((state) => state.setVisualizerState);

  const handleJurisdictionChange: SelectProps['onChange'] = (selectedJurisdictionId) => {
    setVisualizerState({ selectedJurisdictionId });
    selectRef.current?.blur();
  };

  const showSearchConfig = useMemo<SelectProps['showSearch']>(
    () => ({
      filterOption: (input, option) =>
        (option?.label as string).toLowerCase().includes(input.toLowerCase()),
    }),
    [],
  );

  return (
    <Flex gap="middle" flex={1} className="relative h-full min-h-0 overflow-hidden">
      {/* Left Sidebar Toggle Button - Fixed */}
      <Button
        type="primary"
        size="small"
        onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        className="fixed! top-1/2 z-20 h-6 w-6 -translate-y-1/2 shadow-sm transition-all duration-300"
        style={{ left: leftSidebarCollapsed ? 3 : SIDEBAR_WIDTH_PX }}
        aria-label={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
        icon={
          leftSidebarCollapsed ? (
            <RightOutlined className="text-xs" />
          ) : (
            <LeftOutlined className="text-xs" />
          )
        }
      />

      {/* Left Sidebar */}
      <Flex className="shrink-0">
        <Flex
          className={`overflow-hidden transition-all duration-300 ${
            leftSidebarCollapsed ? 'w-0' : SIDEBAR_WIDTH
          }`}
        >
          <CardLayout component="aside" vertical className={`${SIDEBAR_WIDTH} h-full`}>
            <ImportDataPanel />
            <Divider />
            <LegendConfigPanel />
          </CardLayout>
        </Flex>
      </Flex>

      {/* Center Content */}
      <Flex component="main" vertical flex={1} className={`min-w-0 ${APP_LAYOUT_CLASSNAMES.gap}`}>
        {/* Select Jurisdiction Card */}
        <CardLayout className="h-auto shrink-0">
          <SectionTitle IconComponent={GlobalOutlined}>Select Jurisdiction</SectionTitle>
          <Select
            ref={selectRef}
            value={selectedJurisdictionId}
            onChange={handleJurisdictionChange}
            options={JURISDICTION_OPTIONS}
            placeholder="Select a region..."
            className="w-64"
            size="large"
            showSearch={showSearchConfig}
          />
        </CardLayout>

        {/* Map Visualization */}
        <CardLayout className="min-h-0 flex-1">
          <Typography.Title
            level={2}
            className="mb-sm text-primary shrink-0 text-base font-semibold"
          >
            Map Visualization
          </Typography.Title>
          <Suspense fallback={<Spin className="m-auto flex-1" />}>
            <MapViewer className="min-h-0 flex-1" />
          </Suspense>
        </CardLayout>
      </Flex>

      {/* Right Sidebar */}
      <Flex className="shrink-0">
        <Flex
          className={`overflow-hidden transition-all duration-300 ${
            rightSidebarCollapsed ? 'w-0' : SIDEBAR_WIDTH
          }`}
        >
          <CardLayout component="aside" vertical className={`${SIDEBAR_WIDTH} h-full`}>
            <MapStylesPanel />
            <Divider />
            <LegendStylesPanel />
          </CardLayout>
        </Flex>
      </Flex>

      {/* Right Sidebar Toggle Button - Fixed */}
      <Button
        type="primary"
        size="small"
        onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        className="fixed! top-1/2 right-0 z-20 h-6 w-6 -translate-y-1/2 shadow-sm transition-all duration-300"
        style={{ right: rightSidebarCollapsed ? 3 : SIDEBAR_WIDTH_PX }}
        aria-label={rightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
        icon={
          rightSidebarCollapsed ? (
            <LeftOutlined className="text-xs" />
          ) : (
            <RightOutlined className="text-xs" />
          )
        }
      />
    </Flex>
  );
};

export default VisualizerPage;
