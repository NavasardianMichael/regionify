import type { FC } from 'react';
import { ColorPicker, Flex, Input, InputNumber, Modal, Typography } from 'antd';
import type { LegendItem } from '@/store/legendData/types';

type Props = {
  open: boolean;
  editingItem: LegendItem | null;
  onOk: () => void;
  onCancel: () => void;
  onItemChange: (item: LegendItem) => void;
};

const EditLegendItemModal: FC<Props> = ({ open, editingItem, onOk, onCancel, onItemChange }) => {
  return (
    <Modal title="Edit Legend Item" open={open} onOk={onOk} onCancel={onCancel} destroyOnHidden>
      {editingItem && (
        <Flex vertical gap="middle" className="py-md">
          <Flex vertical gap="small">
            <Typography.Text className="text-sm font-medium text-gray-700">Name</Typography.Text>
            <Input
              value={editingItem.name}
              onChange={(e) => onItemChange({ ...editingItem, name: e.target.value })}
              placeholder="Legend name"
            />
          </Flex>
          <div className="gap-md grid grid-cols-2">
            <Flex vertical gap="small">
              <Typography.Text className="text-sm font-medium text-gray-700">
                Min Value
              </Typography.Text>
              <InputNumber
                value={editingItem.min}
                onChange={(value) => onItemChange({ ...editingItem, min: value ?? 0 })}
                min={0}
                className="w-full"
              />
            </Flex>
            <Flex vertical gap="small">
              <Typography.Text className="text-sm font-medium text-gray-700">
                Max Value
              </Typography.Text>
              <InputNumber
                value={editingItem.max}
                onChange={(value) => onItemChange({ ...editingItem, max: value ?? 0 })}
                min={0}
                className="w-full"
              />
            </Flex>
          </div>
          <Flex vertical gap="small">
            <Typography.Text className="text-sm font-medium text-gray-700">Color</Typography.Text>
            <ColorPicker
              value={editingItem.color}
              onChange={(color) => onItemChange({ ...editingItem, color: color.toHexString() })}
              showText
            />
          </Flex>
        </Flex>
      )}
    </Modal>
  );
};

export default EditLegendItemModal;
