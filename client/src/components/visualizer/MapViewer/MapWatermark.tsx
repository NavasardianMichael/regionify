import { type FC, memo } from 'react';
import { Flex, Typography } from 'antd';
import { MAP_WATERMARK_CORNER_INSET_PX } from '@/constants/mapViewer';

type MapWatermarkProps = {
  show: boolean;
};

export const MapWatermark: FC<MapWatermarkProps> = memo(function MapWatermark({ show }) {
  if (!show) return null;

  const cornerStyle = {
    right: MAP_WATERMARK_CORNER_INSET_PX,
    bottom: MAP_WATERMARK_CORNER_INSET_PX,
  };

  return (
    <Flex
      align="center"
      gap={6}
      className="pointer-events-none absolute z-10 opacity-40 select-none"
      style={cornerStyle}
    >
      <img src="/favicon-32x32.png" alt="" className="h-4 w-4" draggable={false} />
      <Typography.Text className="text-xs font-normal tracking-wide text-gray-500">
        Regionify
      </Typography.Text>
    </Flex>
  );
});
