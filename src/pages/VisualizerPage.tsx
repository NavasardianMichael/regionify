import { type FC, useState } from 'react';
import { DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Select } from 'antd';
import { useVisualizerStore } from '@/store/useVisualizerStore';
import { JURISDICTION_OPTIONS } from '@/constants/jurisdictions';
import { ImportDataPanel } from '@/components/visualizer/ImportDataPanel';
import { LegendConfigPanel } from '@/components/visualizer/LegendConfigPanel';
import { LegendStylesPanel } from '@/components/visualizer/LegendStylesPanel';
import { MapStylesPanel } from '@/components/visualizer/MapStylesPanel';
import { MapViewer } from '@/components/visualizer/MapViewer';

export const VisualizerPage: FC = () => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const selectedJurisdiction = useVisualizerStore((state) => state.selectedJurisdiction);
  const setSelectedJurisdiction = useVisualizerStore((state) => state.setSelectedJurisdiction);

  const handleJurisdictionChange = (value: string) => {
    const jurisdiction = JURISDICTION_OPTIONS.find((j) => j.value === value);
    setSelectedJurisdiction(jurisdiction ?? null);
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
  };

  return (
    <div className="gap-md flex h-[calc(100vh-73px)] overflow-hidden">
      {/* Left Sidebar */}
      <aside
        className={`relative flex shrink-0 flex-col transition-all duration-300 ${
          leftSidebarCollapsed ? 'w-0' : 'w-96'
        }`}
      >
        <div
          className={`gap-lg p-md scrollbar-thin flex h-full flex-col overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-sm ${
            leftSidebarCollapsed ? 'invisible w-0 p-0' : ''
          }`}
        >
          <ImportDataPanel />
          <div className="border-t border-gray-200" />
          <LegendConfigPanel />
        </div>
        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className="absolute top-1/2 -right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
          aria-label={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
        >
          {leftSidebarCollapsed ? (
            <RightOutlined className="text-xs text-gray-500" />
          ) : (
            <LeftOutlined className="text-xs text-gray-500" />
          )}
        </button>
      </aside>

      {/* Center Content */}
      <main className="gap-md flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header Card */}
        <Card size="small" className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Select Jurisdiction
              </span>
              <Select
                value={selectedJurisdiction?.value}
                onChange={handleJurisdictionChange}
                options={JURISDICTION_OPTIONS.map((j) => ({ value: j.value, label: j.label }))}
                placeholder="Select a region..."
                className="w-64"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <Button icon={<DownloadOutlined />} size="large" onClick={handleDownload}>
              Download
            </Button>
          </div>
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
            },
          }}
        >
          <h2 className="mb-sm text-primary text-base font-semibold">Map Visualization</h2>
          <MapViewer className="min-h-0 flex-1" />
        </Card>
      </main>

      {/* Right Sidebar */}
      <aside
        className={`relative flex shrink-0 flex-col transition-all duration-300 ${
          rightSidebarCollapsed ? 'w-0' : 'w-72'
        }`}
      >
        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          className="absolute top-1/2 -left-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
          aria-label={rightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
        >
          {rightSidebarCollapsed ? (
            <LeftOutlined className="text-xs text-gray-500" />
          ) : (
            <RightOutlined className="text-xs text-gray-500" />
          )}
        </button>
        <div
          className={`gap-lg p-md scrollbar-thin flex h-full flex-col overflow-x-hidden overflow-y-auto rounded-lg bg-white shadow-sm ${
            rightSidebarCollapsed ? 'invisible w-0 p-0' : ''
          }`}
        >
          <MapStylesPanel />
          <div className="border-t border-gray-200" />
          <LegendStylesPanel />
        </div>
      </aside>
    </div>
  );
};
