import { type FC } from 'react';
import { PictureOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, Flex, Switch, Typography } from 'antd';
import { selectPicture, selectSetPicture, useMapStylesStore } from '@/store/mapStyles/store';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const PictureStylesPanel: FC = () => {
  const picture = useMapStylesStore(selectPicture);
  const setPicture = useMapStylesStore(selectSetPicture);

  const items = [
    {
      key: 'background',
      label: (
        <Flex align="center" gap="small">
          <Typography.Text className="font-semibold">Background</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Transparent</Typography.Text>
            <Switch
              checked={picture.transparentBackground}
              size="small"
              onChange={(checked) => setPicture({ transparentBackground: checked })}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
            <ColorPicker
              value={picture.backgroundColor}
              onChange={(color) => setPicture({ backgroundColor: color.toHexString() })}
              size="small"
              disabled={picture.transparentBackground}
            />
          </Flex>
        </Flex>
      ),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={PictureOutlined}>Picture Styles</SectionTitle>
      <Collapse items={items} defaultActiveKey={['background']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default PictureStylesPanel;
