import { type FC } from 'react';
import { Modal as AntModal } from 'antd';
import { Body } from './Body';
import { Footer } from './Footer';
import { Title } from './Title';
import { useExportMapModal } from './useExportMapModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const state = useExportMapModal(open, onClose);
  const isCropStep = state.step === 2;
  const cropStepDisabled = state.isExporting || state.crop.isGeneratingPreview;

  const bodyClassName = isCropStep
    ? 'scrollbar-thin max-h-[calc(95vh-220px)] overflow-y-auto pb-md'
    : 'scrollbar-thin max-h-[calc(95vh-110px)] overflow-y-auto';

  return (
    <AntModal
      title={<Title variant={isCropStep ? 'crop' : 'export'} />}
      open={open}
      onCancel={onClose}
      confirmLoading={state.isExporting}
      maskClosable={false}
      keyboard={!state.isExporting}
      closable={{ disabled: state.isExporting }}
      centered
      afterOpenChange={state.handleAfterOpenChange}
      footer={
        <Footer
          isCropStep={isCropStep}
          cropStepDisabled={cropStepDisabled}
          downloadDisabled={!state.crop.previewSrc}
          isExporting={state.isExporting}
          downloadLabel={state.downloadButtonLabel}
          onBack={state.handleBack}
          onDownload={state.handleDownload}
        />
      }
      width={isCropStep ? 680 : 400}
      classNames={{
        container: 'max-h-[95vh]',
        body: bodyClassName,
      }}
      destroyOnHidden
    >
      <Body isCropStep={isCropStep} crop={state.crop} formProps={state} />
    </AntModal>
  );
};
