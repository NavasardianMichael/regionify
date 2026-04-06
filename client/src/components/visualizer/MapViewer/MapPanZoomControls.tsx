import { type FC, memo } from 'react';
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  FullscreenOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tooltip } from 'antd';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectZoomControls } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type MapPanZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onResetView: () => void;
};

export const MapPanZoomControls: FC<MapPanZoomControlsProps> = memo(function MapPanZoomControls({
  onZoomIn,
  onZoomOut,
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
  onResetView,
}) {
  const { t } = useTypedTranslation();
  const isTouchDevice = useIsTouchDevice();
  const zoomControls = useMapStylesStore(selectZoomControls);
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);

  if (!zoomControls.show) return null;

  const isDisabled = !selectedCountryId;
  const visibilityClass = `transition-opacity duration-200 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;

  return (
    <>
      {/* Arrow pan buttons */}
      <div className={`top-sm absolute left-1/2 -translate-x-1/2 ${visibilityClass}`}>
        <Tooltip title={t('visualizer.mapStyles.tooltipPanUp')} placement="bottom">
          <Button
            type="default"
            icon={<ArrowUpOutlined />}
            onClick={onPanUp}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipPanUp')}
          />
        </Tooltip>
      </div>
      <div className={`bottom-sm absolute left-1/2 -translate-x-1/2 ${visibilityClass}`}>
        <Tooltip title={t('visualizer.mapStyles.tooltipPanDown')} placement="top">
          <Button
            type="default"
            icon={<ArrowDownOutlined />}
            onClick={onPanDown}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipPanDown')}
          />
        </Tooltip>
      </div>
      <div className={`left-sm absolute top-1/2 -translate-y-1/2 ${visibilityClass}`}>
        <Tooltip title={t('visualizer.mapStyles.tooltipPanLeft')} placement="right">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={onPanLeft}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipPanLeft')}
          />
        </Tooltip>
      </div>
      <div className={`right-sm absolute top-1/2 -translate-y-1/2 ${visibilityClass}`}>
        <Tooltip title={t('visualizer.mapStyles.tooltipPanRight')} placement="left">
          <Button
            type="default"
            icon={<ArrowRightOutlined />}
            onClick={onPanRight}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipPanRight')}
          />
        </Tooltip>
      </div>

      {/* Zoom and action buttons */}
      <Flex
        vertical
        gap={4}
        className="absolute"
        style={{ right: zoomControls.position.x, bottom: zoomControls.position.y }}
      >
        <Tooltip title={t('visualizer.mapStyles.tooltipZoomIn')} placement="left">
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={onZoomIn}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipZoomIn')}
          />
        </Tooltip>
        <Tooltip title={t('visualizer.mapStyles.tooltipZoomOut')} placement="left">
          <Button
            type="default"
            icon={<MinusOutlined />}
            onClick={onZoomOut}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipZoomOut')}
          />
        </Tooltip>
        <Tooltip title={t('visualizer.mapStyles.tooltipResetMapAndLabels')} placement="left">
          <Button
            type="default"
            icon={<FullscreenOutlined />}
            onClick={onResetView}
            disabled={isDisabled}
            className="shadow-md"
            aria-label={t('visualizer.mapStyles.tooltipResetMapAndLabels')}
          />
        </Tooltip>
      </Flex>
    </>
  );
});
