import { type FC, lazy, Suspense } from 'react';
import { Flex, Spin } from 'antd';
import { type ExportCropState } from './useExportCrop';

const ExportCropStepAsync = lazy(() =>
  import('@/components/visualizer/ExportMapModal/ExportCropStep').then((m) => ({
    default: m.ExportCropStep,
  })),
);

type ExportMapModalCropPanelProps = {
  crop: ExportCropState;
};

export const ExportMapModalCropPanel: FC<ExportMapModalCropPanelProps> = ({ crop }) => (
  <Suspense
    fallback={
      <Flex justify="center" align="center" className="h-80">
        <Spin size="large" />
      </Flex>
    }
  >
    <ExportCropStepAsync crop={crop} />
  </Suspense>
);
