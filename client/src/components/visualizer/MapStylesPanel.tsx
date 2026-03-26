import { type FC, useCallback, useMemo, useState } from 'react';
import { BgColorsOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PLANS } from '@regionify/shared';
import { Collapse, type ColorPickerProps, Flex, type SwitchProps, Typography } from 'antd';
import {
  selectBorder,
  selectRegionLabels,
  selectSetBorder,
  selectSetRegionLabels,
  selectSetShadow,
  selectSetZoomControls,
  selectShadow,
  selectZoomControls,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  MapStylesBackgroundSection,
  MapStylesBorderSection,
  MapStylesRegionLabelsSection,
  MapStylesShadowSection,
  MapStylesZoomSection,
} from '@/components/visualizer/MapStylesPanel/sections';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const DEBOUNCE_MS = 150;

const MapStylesPanel: FC = () => {
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const picture = useMapStylesStore((state) => state.picture);
  const setPicture = useMapStylesStore((state) => state.setPicture);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const zoomControls = useMapStylesStore(selectZoomControls);
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const setBorder = useMapStylesStore(selectSetBorder);
  const setShadow = useMapStylesStore(selectSetShadow);
  const setZoomControls = useMapStylesStore(selectSetZoomControls);
  const setRegionLabels = useMapStylesStore(selectSetRegionLabels);

  const [localOffsetX, setLocalOffsetX] = useState(shadow.offsetX);
  const [localOffsetY, setLocalOffsetY] = useState(shadow.offsetY);

  const debouncedSetOffsetX = useDebouncedCallback(
    (value: number) => setShadow({ offsetX: value }),
    DEBOUNCE_MS,
  );
  const debouncedSetOffsetY = useDebouncedCallback(
    (value: number) => setShadow({ offsetY: value }),
    DEBOUNCE_MS,
  );

  const handleTransparentChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setPicture({ transparentBackground: checked }),
    [setPicture],
  );
  const handleBackgroundColorChange = useCallback<
    NonNullable<ColorPickerProps['onChangeComplete']>
  >((color) => setPicture({ backgroundColor: color.toHexString() }), [setPicture]);

  const handleBorderShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setBorder({ show: checked }),
    [setBorder],
  );
  const handleBorderColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setBorder({ color: color.toHexString() }),
    [setBorder],
  );
  const handleBorderWidthChange = useCallback(
    (value: number) => setBorder({ width: value }),
    [setBorder],
  );

  const handleShadowShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setShadow({ show: checked }),
    [setShadow],
  );
  const handleShadowColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setShadow({ color: color.toHexString() }),
    [setShadow],
  );
  const handleShadowBlurChange = useCallback(
    (value: number) => setShadow({ blur: value }),
    [setShadow],
  );
  const handleShadowOffsetXChange = useCallback(
    (value: number | null) => {
      const val = value ?? 0;
      setLocalOffsetX(val);
      debouncedSetOffsetX(val);
    },
    [debouncedSetOffsetX],
  );
  const handleShadowOffsetYChange = useCallback(
    (value: number | null) => {
      const val = value ?? 0;
      setLocalOffsetY(val);
      debouncedSetOffsetY(val);
    },
    [debouncedSetOffsetY],
  );

  const handleZoomControlsShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setZoomControls({ show: checked }),
    [setZoomControls],
  );

  const handleRegionLabelsShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setRegionLabels({ show: checked }),
    [setRegionLabels],
  );
  const handleRegionLabelsColorChange = useCallback<
    NonNullable<ColorPickerProps['onChangeComplete']>
  >((color) => setRegionLabels({ color: color.toHexString() }), [setRegionLabels]);
  const handleRegionLabelsFontSizeChange = useCallback(
    (value: number) => setRegionLabels({ fontSize: value }),
    [setRegionLabels],
  );

  const items = useMemo(
    () => [
      {
        key: 'background',
        label: (
          <Flex align="center" gap="small">
            <Typography.Text className="font-semibold">
              {t('visualizer.mapStyles.collapseBackground')}
            </Typography.Text>
            {plan === PLANS.observer && (
              <InfoCircleOutlined style={{ color: '#888', marginLeft: 4 }} />
            )}
          </Flex>
        ),
        children: (
          <MapStylesBackgroundSection
            plan={plan}
            picture={picture}
            onTransparentChange={handleTransparentChange}
            onBackgroundColorChange={handleBackgroundColorChange}
          />
        ),
      },
      {
        key: 'border',
        label: (
          <Flex align="center" gap="small">
            <Typography.Text className="font-semibold">
              {t('visualizer.mapStyles.collapseBorder')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <MapStylesBorderSection
            border={border}
            onShowChange={handleBorderShowChange}
            onColorChange={handleBorderColorChange}
            onWidthChange={handleBorderWidthChange}
          />
        ),
      },
      {
        key: 'shadow',
        label: (
          <Flex align="center" gap="small">
            <Typography.Text className="font-semibold">
              {t('visualizer.mapStyles.collapseShadow')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <MapStylesShadowSection
            shadow={shadow}
            localOffsetX={localOffsetX}
            localOffsetY={localOffsetY}
            onShowChange={handleShadowShowChange}
            onColorChange={handleShadowColorChange}
            onBlurChange={handleShadowBlurChange}
            onOffsetXChange={handleShadowOffsetXChange}
            onOffsetYChange={handleShadowOffsetYChange}
          />
        ),
      },
      {
        key: 'zoom',
        label: (
          <Flex align="center" gap="small">
            <Typography.Text className="font-semibold">
              {t('visualizer.mapStyles.collapseControls')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <MapStylesZoomSection
            zoomControls={zoomControls}
            onShowChange={handleZoomControlsShowChange}
          />
        ),
      },
      {
        key: 'labels',
        label: (
          <Flex align="center" gap="small">
            <Typography.Text className="font-semibold">
              {t('visualizer.mapStyles.collapseRegionLabels')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <MapStylesRegionLabelsSection
            regionLabels={regionLabels}
            onShowChange={handleRegionLabelsShowChange}
            onColorChange={handleRegionLabelsColorChange}
            onFontSizeChange={handleRegionLabelsFontSizeChange}
          />
        ),
      },
    ],
    [
      plan,
      picture,
      border,
      shadow,
      localOffsetX,
      localOffsetY,
      zoomControls,
      regionLabels,
      handleTransparentChange,
      handleBackgroundColorChange,
      handleBorderShowChange,
      handleBorderColorChange,
      handleBorderWidthChange,
      handleShadowShowChange,
      handleShadowColorChange,
      handleShadowBlurChange,
      handleShadowOffsetXChange,
      handleShadowOffsetYChange,
      handleZoomControlsShowChange,
      handleRegionLabelsShowChange,
      handleRegionLabelsColorChange,
      handleRegionLabelsFontSizeChange,
      t,
    ],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={BgColorsOutlined}>
        {t('visualizer.mapStyles.sectionTitle')}
      </SectionTitle>
      <Collapse items={items} defaultActiveKey={[]} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default MapStylesPanel;
