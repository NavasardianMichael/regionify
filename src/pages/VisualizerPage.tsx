import { type FC, lazy, Suspense, useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Spin, Typography } from 'antd';
import { CardLayout } from '@/components/visualizer/CardLayout';
import { JurisdictionSelect } from '@/components/visualizer/JurisdictionSelect';

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
            <JurisdictionSelect />
            <Divider />
            <ImportDataPanel />
            <Divider />
            <LegendConfigPanel />
          </CardLayout>
        </Flex>
      </Flex>

      {/* Center Content */}
      <Flex component="main" flex={1}>
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
