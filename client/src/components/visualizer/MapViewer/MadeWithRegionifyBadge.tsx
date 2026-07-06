import { type FC, memo } from 'react';
import { Flex } from 'antd';
import { MADE_WITH_BADGE_HREF, MAP_WATERMARK_CORNER_INSET_PX } from '@/constants/mapViewer';

export const MadeWithRegionifyBadge: FC = memo(function MadeWithRegionifyBadge() {
  const cornerStyle = {
    right: MAP_WATERMARK_CORNER_INSET_PX,
    bottom: MAP_WATERMARK_CORNER_INSET_PX,
  };

  return (
    <a
      href={MADE_WITH_BADGE_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Made with Regionify"
      className="absolute z-10 select-none"
      style={cornerStyle}
    >
      <Flex align="center" gap={6}>
        <img src="/favicon-32x32.png" alt="" className="h-3.5 w-3.5" draggable={false} />
        <span className="text-xs font-medium tracking-wide text-gray-600 underline underline-offset-2">
          Made with Regionify
        </span>
      </Flex>
    </a>
  );
});
