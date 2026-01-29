import { type FC, lazy, Suspense, useMemo, useState } from 'react';
import { DownloadOutlined, GlobalOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Select, type SelectProps, Spin, Typography } from 'antd';
import { useVisualizerStore } from '@/store/mapData/store';
import { JURISDICTION_OPTIONS } from '@/constants/jurisdictions';

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
      <Flex
        component="aside"
        vertical
        className={`relative shrink-0 overflow-visible transition-all duration-300 ${
          leftSidebarCollapsed ? 'w-0' : 'w-96'
        }`}
      >
        <Flex
          vertical
          gap="large"
          className={`p-md scrollbar-thin h-full overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-sm ${
            leftSidebarCollapsed ? 'invisible w-0 p-0' : ''
          }`}
        >
          <Suspense fallback={<Spin className="m-auto" />}>
            <ImportDataPanel />
          </Suspense>
          <div className="border-t border-gray-200" />
          <Suspense fallback={<Spin className="m-auto" />}>
            <LegendConfigPanel />
          </Suspense>
        </Flex>
        {/* Collapse Button */}
        <Button
          type="text"
          shape="circle"
          size="small"
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className="absolute top-1/2 -right-3 z-10 h-6 w-6 -translate-y-1/2 border border-gray-200 bg-white shadow-sm"
          aria-label={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
          icon={
            leftSidebarCollapsed ? (
              <RightOutlined className="text-xs text-gray-500" />
            ) : (
              <LeftOutlined className="text-xs text-gray-500" />
            )
          }
        />
      </Flex>

      {/* Center Content */}
      <Flex component="main" vertical gap="middle" flex={1} className="min-w-0 overflow-hidden">
        {/* Header Card */}
        <Card size="small" className="shrink-0">
          <Flex align="center" justify="space-between">
            <Flex vertical gap="small">
              <Flex align="center" gap="small">
                <GlobalOutlined className="text-base text-gray-500" />
                <Typography.Title level={3} className="text-primary text-base font-semibold">
                  Select Jurisdiction
                </Typography.Title>
              </Flex>
              <Select
                value={selectedJurisdictionId}
                onChange={handleJurisdictionChange}
                options={JURISDICTION_OPTIONS}
                placeholder="Select a region..."
                className="w-64"
                size="large"
                showSearch={showSearchConfig}
              />
            </Flex>
            <Button icon={<DownloadOutlined />} size="large" onClick={handleDownload}>
              Download
            </Button>
          </Flex>
        </Card>

        {/* Map Visualization */}
        <Card
          size="small"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          styles={{
            body: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 12,
              minHeight: 0,
            },
          }}
        >
          <Typography.Title
            level={2}
            className="mb-sm text-primary shrink-0 text-base font-semibold"
          >
            Map Visualization
          </Typography.Title>
          <Suspense fallback={<Spin className="m-auto flex-1" />}>
            <MapViewer className="min-h-0 flex-1" />
          </Suspense>
        </Card>
      </Flex>

      {/* Right Sidebar */}
      <Flex
        component="aside"
        vertical
        className={`relative shrink-0 overflow-visible transition-all duration-300 ${
          rightSidebarCollapsed ? 'w-0' : 'w-72'
        }`}
      >
        <Flex
          vertical
          gap="large"
          className={`p-md scrollbar-thin h-full overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-sm ${
            rightSidebarCollapsed ? 'invisible w-0 p-0' : ''
          }`}
        >
          <Suspense fallback={<Spin className="m-auto" />}>
            <MapStylesPanel />
          </Suspense>
          <div className="border-t border-gray-200" />
          <Suspense fallback={<Spin className="m-auto" />}>
            <LegendStylesPanel />
          </Suspense>
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
    </Flex>
  );
};

export default VisualizerPage;
