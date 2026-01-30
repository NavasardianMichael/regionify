import { type FC, Suspense } from 'react';
import { Divider, Spin, Splitter, Typography } from 'antd';
import { CardLayout } from '@/components/visualizer/CardLayout';
import ImportDataPanel from '@/components/visualizer/ImportDataPanel';
import { JurisdictionSelect } from '@/components/visualizer/JurisdictionSelect';
import LegendConfigPanel from '@/components/visualizer/LegendConfigPanel';
import LegendStylesPanel from '@/components/visualizer/LegendStylesPanel';
import MapStylesPanel from '@/components/visualizer/MapStylesPanel';
import MapViewer from '@/components/visualizer/MapViewer';

const VisualizerPage: FC = () => {
  return (
    <Splitter className="h-full min-h-0">
      {/* Left Sidebar */}
      <Splitter.Panel
        defaultSize="25%"
        min="15%"
        max="40%"
        collapsible={{ start: true, end: true, showCollapsibleIcon: true }}
      >
        <CardLayout component="aside" vertical className="h-full">
          <JurisdictionSelect />
          <Divider />
          <ImportDataPanel />
          <Divider />
          <LegendConfigPanel />
        </CardLayout>
      </Splitter.Panel>

      {/* Center Content */}
      <Splitter.Panel>
        <CardLayout className="h-full min-h-0">
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
      </Splitter.Panel>

      {/* Right Sidebar */}
      <Splitter.Panel
        defaultSize="20%"
        min="15%"
        max="35%"
        collapsible={{ start: true, end: true, showCollapsibleIcon: true }}
      >
        <CardLayout component="aside" vertical className="h-full">
          <MapStylesPanel />
          <Divider />
          <LegendStylesPanel />
        </CardLayout>
      </Splitter.Panel>
    </Splitter>
  );
};

export default VisualizerPage;
