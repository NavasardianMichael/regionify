import { type FC, memo } from 'react';
import { Flex, Typography } from 'antd';
import { selectZoomControls } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';

/** Shift slightly toward the bottom edge so the mark sits under the control stack instead of on it. */
const OBSERVER_WATERMARK_BOTTOM_BELOW_ZOOM_ANCHOR_PX = 24;

type MapWatermarkProps = {
  show: boolean;
  /**
   * Pin to the bottom-right of the positioned parent (map + bottom legend card).
   * Matches export corner inset; skips zoom-stack offset used for the map-only strip.
   */
  pinToExportFrame?: boolean;
};

export const MapWatermark: FC<MapWatermarkProps> = memo(function MapWatermark({
  show,
  pinToExportFrame = false,
}) {
  const zoomControls = useMapStylesStore(selectZoomControls);

  if (!show) return null;

  const cornerStyle = { right: 12, bottom: 12 };

  const positionStyle =
    pinToExportFrame || !zoomControls.show
      ? cornerStyle
      : {
          right: zoomControls.position.x,
          bottom: Math.max(
            0,
            zoomControls.position.y - OBSERVER_WATERMARK_BOTTOM_BELOW_ZOOM_ANCHOR_PX,
          ),
        };

  return (
    <Flex
      align="center"
      gap={6}
      className="pointer-events-none absolute z-10 opacity-40 select-none"
      style={positionStyle}
    >
      <img src="/favicon-32x32.png" alt="" className="h-4 w-4" draggable={false} />
      <Typography.Text className="text-xs font-semibold tracking-wide text-gray-500">
        Regionify
      </Typography.Text>
    </Flex>
  );
});
