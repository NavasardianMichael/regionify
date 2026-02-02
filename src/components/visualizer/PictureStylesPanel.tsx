import { type FC, useCallback, useMemo } from 'react';
import { PictureOutlined } from '@ant-design/icons';
import {
  Collapse,
  ColorPicker,
  type ColorPickerProps,
  Flex,
  Switch,
  type SwitchProps,
  Typography,
} from 'antd';
import { selectPicture, selectSetPicture } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const PictureStylesPanel: FC = () => {
  const picture = useMapStylesStore(selectPicture);
  const setPicture = useMapStylesStore(selectSetPicture);

  const handleTransparentChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setPicture({ transparentBackground: checked }),
    [setPicture],
  );

  const handleBackgroundColorChange = useCallback<
    NonNullable<ColorPickerProps['onChangeComplete']>
  >((color) => setPicture({ backgroundColor: color.toHexString() }), [setPicture]);

  const items = useMemo(
    () => [
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
              <Typography.Text className="text-sm text-gray-600" id="transparent-bg-label">
                Transparent
              </Typography.Text>
              <Switch
                checked={picture.transparentBackground}
                size="small"
                onChange={handleTransparentChange}
                aria-labelledby="transparent-bg-label"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
              <ColorPicker
                value={picture.backgroundColor}
                onChangeComplete={handleBackgroundColorChange}
                size="small"
                disabled={picture.transparentBackground}
              />
            </Flex>
          </Flex>
        ),
      },
    ],
    [picture, handleTransparentChange, handleBackgroundColorChange],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={PictureOutlined}>Picture Styles</SectionTitle>
      <Collapse items={items} defaultActiveKey={['background']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default PictureStylesPanel;
