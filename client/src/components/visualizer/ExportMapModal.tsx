import { type FC, useMemo } from 'react';
import { DownloadOutlined, ScissorOutlined } from '@ant-design/icons';
import { Flex, Modal, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { ExportCropStep } from '@/components/visualizer/ExportMapModal/ExportCropStep';
import { ExportMapModalForm } from '@/components/visualizer/ExportMapModal/ExportMapModalForm';
import { useExportMapModal } from '@/components/visualizer/ExportMapModal/useExportMapModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const state = useExportMapModal(open, onClose);
  const { t } = useTypedTranslation();
  const isStep2 = state.step === 2;

  const title = useMemo(() => {
    const icon = isStep2 ? (
      <ScissorOutlined className="text-primary" />
    ) : (
      <DownloadOutlined className="text-primary" />
    );
    const text = isStep2
      ? t('visualizer.exportModal.cropAndDownload')
      : t('visualizer.exportModal.title');

    return (
      <Flex align="center" gap="small" className="mb-6!">
        {icon}
        <Typography.Title level={4} className="mb-0!">
          {text}
        </Typography.Title>
      </Flex>
    );
  }, [isStep2, t]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      confirmLoading={state.isExporting}
      maskClosable={false}
      keyboard={!state.isExporting}
      closable={{ disabled: state.isExporting }}
      afterOpenChange={state.handleAfterOpenChange}
      footer={null}
      width={isStep2 ? 680 : 400}
      destroyOnHidden
    >
      {isStep2 ? (
        <ExportCropStep
          crop={state.crop}
          isExporting={state.isExporting}
          downloadButtonLabel={state.downloadButtonLabel}
          onBack={state.handleBack}
          onDownload={state.handleDownload}
        />
      ) : (
        <ExportMapModalForm {...state} />
      )}
    </Modal>
  );
};

export default ExportMapModal;
