import { type FC, useState } from 'react';
import { Button, Flex, Input, Modal, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  open: boolean;
  onClose: () => void;
};

const AiParserModal: FC<Props> = ({ open, onClose }) => {
  const { t } = useTypedTranslation();
  const [text, setText] = useState('');

  const handleSubmit = () => {
    console.log('AI parse submitted:', text);
  };

  return (
    <Modal
      title={t('visualizer.aiParserModal.title')}
      open={open}
      onCancel={onClose}
      closable
      maskClosable={false}
      footer={
        <Flex justify="flex-end" gap="small">
          <Button onClick={onClose}>{t('nav.cancel')}</Button>
          <Button type="primary" onClick={handleSubmit}>
            {t('visualizer.aiParserModal.submit')}
          </Button>
        </Flex>
      }
      centered
      destroyOnHidden
      focusable={{ trap: false }}
    >
      <Flex vertical gap="small" className="py-md">
        <Typography.Text type="secondary" className="text-xs">
          {t('visualizer.aiParserModal.limitedRequestsNote')}
        </Typography.Text>
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('visualizer.aiParserModal.placeholder')}
          rows={10}
          className="font-mono text-sm"
        />
      </Flex>
    </Modal>
  );
};

export default AiParserModal;
