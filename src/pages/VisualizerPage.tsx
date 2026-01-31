import { type FC, Suspense, useCallback, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Spin, Splitter, Typography } from 'antd';
import { CardLayout } from '@/components/visualizer/CardLayout';
import ExportMapModal from '@/components/visualizer/ExportMapModal';
import GeneralStylesPack from '@/components/visualizer/GeneralStylesPack';
import ImportDataPanel from '@/components/visualizer/ImportDataPanel';
import LegendConfigPanel from '@/components/visualizer/LegendConfigPanel';
import LegendStylesPanel from '@/components/visualizer/LegendStylesPanel';
import MapStylesPanel from '@/components/visualizer/MapStylesPanel';
import MapViewer from '@/components/visualizer/MapViewer';
import PictureStylesPanel from '@/components/visualizer/PictureStylesPanel';
import { RegionSelect } from '@/components/visualizer/RegionSelect';

const VisualizerPage: FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  return (
    <>
      <Splitter className="h-full min-h-0 w-full">
        {/* Left Sidebar */}
        <Splitter.Panel
          defaultSize="25%"
          min="15%"
          max="40%"
          collapsible={{ start: true, end: true, showCollapsibleIcon: true }}
        >
          <CardLayout component="aside" vertical className="h-full">
            <RegionSelect />
            <Divider />
            <ImportDataPanel />
            <Divider />
            <LegendConfigPanel />
          </CardLayout>
        </Splitter.Panel>

        {/* Center Content */}
        <Splitter.Panel>
          <CardLayout className="min-h-md gap-md h-full">
            <Flex align="center" justify="space-between" className="mb-sm shrink-0" gap="middle">
              <Typography.Title level={3} className="text-primary mb-0! text-base font-semibold">
                Map Visualization
              </Typography.Title>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleOpenExportModal}>
                Export
              </Button>
            </Flex>
            <Suspense fallback={<Spin className="m-auto flex-1" />}>
              <MapViewer className="min-h-0 flex-1" />
            </Suspense>
          </CardLayout>
        </Splitter.Panel>

        {/* Right Sidebar */}
        <Splitter.Panel
          defaultSize="25%"
          min="15%"
          max="35%"
          collapsible={{ start: true, end: false, showCollapsibleIcon: true }}
        >
          <CardLayout component="aside" vertical className="h-full">
            <MapStylesPanel />
            <Divider />
            <LegendStylesPanel />
            <Divider />
            <PictureStylesPanel />
            <Divider />
            <GeneralStylesPack />
          </CardLayout>
        </Splitter.Panel>
      </Splitter>

      {/* Export Modal */}
      <ExportMapModal open={isExportModalOpen} onClose={handleCloseExportModal} />
    </>
  );
};

export default VisualizerPage;
