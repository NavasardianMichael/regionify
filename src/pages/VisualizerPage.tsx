import { type FC, lazy, Suspense, useMemo, useState } from 'react';
import { DownloadOutlined, GlobalOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Select, type SelectProps, Spin, Typography } from 'antd';
import { useVisualizerStore } from '@/store/mapData/store';
import { JURISDICTION_OPTIONS } from '@/constants/jurisdictions';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { CardLayout } from '@/components/visualizer/CardLayout';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const ImportDataPanel = lazy(() => import('@/components/visualizer/ImportDataPanel'));
const LegendConfigPanel = lazy(() => import('@/components/visualizer/LegendConfigPanel'));
const LegendStylesPanel = lazy(() => import('@/components/visualizer/LegendStylesPanel'));
const MapStylesPanel = lazy(() => import('@/components/visualizer/MapStylesPanel'));
const MapViewer = lazy(() => import('@/components/visualizer/MapViewer'));

const VisualizerPage: FC = () => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const selectedJurisdictionId = useVisualizerStore((state) => state.selectedJurisdictionId);
  const setVisualizerState = useVisualizerStore((state) => state.setVisualizerState);

  const handleJurisdictionChange: SelectProps['onChange'] = (selectedJurisdictionId) => {
    setVisualizerState({ selectedJurisdictionId });
  };

  const showSearchConfig = useMemo<SelectProps['showSearch']>(
    () => ({
      filterOption: (input, option) =>
        (option?.label as string).toLowerCase().includes(input.toLowerCase()),
    }),
    [],
  );

  const handleDownload = () => {
    // TODO: Implement download functionality
  };

  return (
    <Flex gap="middle" flex={1} className="h-full min-h-0 overflow-hidden">
      {/* Left Sidebar */}
      <Flex component="main" vertical flex={1} className={`shrink-0 ${APP_LAYOUT_CLASSNAMES.gap}`}>
        <CardLayout
          component="aside"
          className={`relative transition-all duration-300 ${
            leftSidebarCollapsed ? 'w-0' : 'w-96'
          }`}
        >
          <ImportDataPanel />
        </CardLayout>
        <CardLayout
          component="aside"
          className={`relative transition-all duration-300 ${
            leftSidebarCollapsed ? 'w-0' : 'w-96'
          }`}
        >
          <LegendConfigPanel />
        </CardLayout>
      </Flex>
      {/* Collapse Button */}
      <Button
        type="text"
        shape="circle"
        size="small"
        onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        className="absolute top-1/2 left-0 z-10 h-6 w-6 -translate-y-1/2 border border-gray-200 bg-white shadow-sm"
        aria-label={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
        icon={
          leftSidebarCollapsed ? (
            <RightOutlined className="text-xs text-gray-500" />
          ) : (
            <LeftOutlined className="text-xs text-gray-500" />
          )
        }
      />

      {/* Center Content */}
      <Flex component="main" vertical flex={1} className={`${APP_LAYOUT_CLASSNAMES.gap}`}>
        {/* Select Jurisdiction Card */}
        <CardLayout>
          <SectionTitle IconComponent={GlobalOutlined}>Select Jurisdiction</SectionTitle>
          <Select
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
        <CardLayout>
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
      <Flex component="main" vertical flex={1} className={`shrink-0 ${APP_LAYOUT_CLASSNAMES.gap}`}>
        <CardLayout
          component="aside"
          className={`relative transition-all duration-300 ${
            rightSidebarCollapsed ? 'w-0' : 'w-72'
          }`}
        >
          <MapStylesPanel />
        </CardLayout>
        <CardLayout
          component="aside"
          className={`relative transition-all duration-300 ${
            rightSidebarCollapsed ? 'w-0' : 'w-72'
          }`}
        >
          <LegendStylesPanel />
        </CardLayout>
      </Flex>
      {/* Collapse Button */}
      <Button
        type="text"
        shape="circle"
        size="small"
        onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        className="absolute top-1/2 -left-3 z-10 h-6 w-6 -translate-y-1/2 border border-gray-200 bg-white shadow-sm"
        aria-label={rightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
        icon={
          rightSidebarCollapsed ? (
            <LeftOutlined className="text-xs text-gray-500" />
          ) : (
            <RightOutlined className="text-xs text-gray-500" />
          )
        }
      />
    </Flex>
  );
};

export default VisualizerPage;
