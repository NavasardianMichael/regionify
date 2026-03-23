import { type FC } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Flex, Modal, Typography } from 'antd';
import { ExportMapModalForm } from '@/components/visualizer/ExportMapModal/ExportMapModalForm';
import { useExportMapModal } from '@/components/visualizer/ExportMapModal/useExportMapModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const state = useExportMapModal(open, onClose);

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-6!">
          <DownloadOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            Export Map Visualizer
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      confirmLoading={state.isExporting}
      maskClosable={false}
      keyboard={!state.isExporting}
      closable={{ disabled: state.isExporting }}
      afterOpenChange={state.handleAfterOpenChange}
      footer={null}
      width={400}
      destroyOnHidden
    >
      <ExportMapModalForm {...state} />
    </Modal>
  );
};

export default ExportMapModal;
