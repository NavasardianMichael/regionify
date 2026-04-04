import { type FC } from 'react';
import { Modal } from 'antd';
import { ExportMapModalCropFooter } from '@/components/visualizer/ExportMapModal/ExportMapModalCropFooter';
import { ExportMapModalCropPanel } from '@/components/visualizer/ExportMapModal/ExportMapModalCropPanel';
import { ExportMapModalForm } from '@/components/visualizer/ExportMapModal/ExportMapModalForm';
import { ExportMapModalTitle } from '@/components/visualizer/ExportMapModal/ExportMapModalTitle';
import { useExportMapModal } from '@/components/visualizer/ExportMapModal/useExportMapModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const state = useExportMapModal(open, onClose);
  const isCropStep = state.step === 2;
  const cropStepDisabled = state.isExporting || state.crop.isGeneratingPreview;

  const bodyClassName = isCropStep
    ? 'scrollbar-thin max-h-[calc(95vh-220px)] overflow-y-auto pb-md'
    : 'scrollbar-thin max-h-[calc(95vh-110px)] overflow-y-auto';

  return (
    <Modal
      title={<ExportMapModalTitle variant={isCropStep ? 'crop' : 'export'} />}
      open={open}
      onCancel={onClose}
      confirmLoading={state.isExporting}
      maskClosable={false}
      keyboard={!state.isExporting}
      closable={{ disabled: state.isExporting }}
      centered
      afterOpenChange={state.handleAfterOpenChange}
      footer={
        isCropStep ? (
          <ExportMapModalCropFooter
            disabled={cropStepDisabled}
            downloadDisabled={!state.crop.previewSrc}
            isExporting={state.isExporting}
            downloadLabel={state.downloadButtonLabel}
            onBack={state.handleBack}
            onDownload={state.handleDownload}
          />
        ) : null
      }
      width={isCropStep ? 680 : 400}
      classNames={{
        container: 'max-h-[95vh]',
        body: bodyClassName,
      }}
      destroyOnHidden
    >
      {isCropStep ? (
        <ExportMapModalCropPanel crop={state.crop} />
      ) : (
        <ExportMapModalForm {...state} />
      )}
    </Modal>
  );
};

export default ExportMapModal;
