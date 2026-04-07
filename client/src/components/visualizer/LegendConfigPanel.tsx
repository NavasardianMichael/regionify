import { type FC, lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  BarChartOutlined,
  BgColorsOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Collapse,
  ColorPicker,
  type ColorPickerProps,
  Flex,
  Tooltip,
  Typography,
} from 'antd';
import {
  selectAddItem,
  selectLegendItems,
  selectRemoveItem,
  selectReorderItems,
  selectSetItems,
  selectSortItems,
  selectUpdateItem,
} from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import type { LegendItem } from '@/store/legendData/types';
import { selectNoDataColor, selectSetLegendStylesState } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { samplePaletteColor } from '@/helpers/samplePaletteColor';
import { LegendItemRow } from '@/components/visualizer/LegendItemRow';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const EditLegendModal = lazy(() =>
  import('./EditLegendModal/Modal').then((m) => ({ default: m.EditLegendModal })),
);

const GRID_COLS = 'grid-cols-[24px_minmax(80px,1fr)_60px_60px_36px_32px]';

type PaletteSuggestion = {
  id: string;
  name: string;
  colors: string[];
};

type PaletteGroup = {
  id: string;
  titleKey:
    | 'visualizer.legendConfig.paletteGroups.smooth'
    | 'visualizer.legendConfig.paletteGroups.creative'
    | 'visualizer.legendConfig.paletteGroups.highContrast';
  suggestions: PaletteSuggestion[];
};

const PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: 'smooth',
    titleKey: 'visualizer.legendConfig.paletteGroups.smooth',
    suggestions: [
      {
        id: 'tailwind-blue',
        name: 'Blue',
        colors: ['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A8A'],
      },
      {
        id: 'tailwind-amber',
        name: 'Amber',
        colors: ['#FEF3C7', '#FCD34D', '#F59E0B', '#B45309', '#78350F'],
      },
      {
        id: 'tailwind-teal',
        name: 'Teal',
        colors: ['#CCFBF1', '#5EEAD4', '#14B8A6', '#0F766E', '#134E4A'],
      },
      {
        id: 'antd-lime',
        name: 'Lime',
        colors: ['#FCFFE6', '#D3F261', '#A0D911', '#5B8C00', '#254000'],
      },
      {
        id: 'tailwind-rose',
        name: 'Rose',
        colors: ['#FFE4E6', '#FDA4AF', '#F43F5E', '#BE123C', '#881337'],
      },
    ],
  },
  {
    id: 'creative',
    titleKey: 'visualizer.legendConfig.paletteGroups.creative',
    suggestions: [
      {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        colors: ['#00F5D4', '#00BBF9', '#9B5DE5', '#F15BB5', '#FEE440'],
      },
      {
        id: 'retro-pop',
        name: 'Retro Pop',
        colors: ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#8338EC'],
      },
      {
        id: 'cosmic',
        name: 'Cosmic',
        colors: ['#2B2D42', '#5A189A', '#9D4EDD', '#F72585', '#4CC9F0'],
      },
      {
        id: 'neon-pop',
        name: 'Neon Pop',
        colors: ['#00F5FF', '#00FF85', '#E9FF70', '#FF9E00', '#FF4D6D'],
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        colors: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#A855F7'],
      },
    ],
  },
  {
    id: 'high-contrast',
    titleKey: 'visualizer.legendConfig.paletteGroups.highContrast',
    suggestions: [
      // Category-like high contrast colors for clearly separated ranges.
      {
        id: 'hc-danger',
        name: 'Danger Stripe',
        colors: ['#000000', '#FDE047', '#DC2626', '#2563EB', '#16A34A'],
      },
      {
        id: 'hc-vivid',
        name: 'Vivid',
        colors: ['#0038FF', '#FF005C', '#00C853', '#FF9800', '#6200EA'],
      },
      {
        id: 'hc-accessible',
        name: 'Accessible',
        colors: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#F0E442'],
      },
      {
        id: 'hc-dark-light',
        name: 'Dark / Light',
        colors: ['#111827', '#FFFFFF', '#B91C1C', '#1D4ED8', '#065F46'],
      },
      {
        id: 'hc-signal',
        name: 'Signal',
        colors: ['#B91C1C', '#F59E0B', '#15803D', '#2563EB', '#6D28D9'],
      },
    ],
  },
];

const PALETTE_BY_ID = new Map<string, string[]>(
  PALETTE_GROUPS.flatMap((g) => g.suggestions.map((s) => [s.id, s.colors] as [string, string[]])),
);

const LegendConfigPanel: FC = () => {
  const { t } = useTypedTranslation();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const items = useLegendDataStore(selectLegendItems);
  const addItem = useLegendDataStore(selectAddItem);
  const updateItem = useLegendDataStore(selectUpdateItem);
  const removeItem = useLegendDataStore(selectRemoveItem);
  const sortItems = useLegendDataStore(selectSortItems);
  const setItems = useLegendDataStore(selectSetItems);
  const reorderItems = useLegendDataStore(selectReorderItems);
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const setLegendStylesState = useLegendStylesStore(selectSetLegendStylesState);

  const legendItems = useMemo(
    () => items.allIds.map((id) => items.byId[id]),
    [items.allIds, items.byId],
  );

  const handleSort = useCallback(() => {
    sortItems(sortDirection);
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, [sortDirection, sortItems]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSaveFromModal = useCallback(
    (newItems: LegendItem[]) => {
      setItems(newItems);
      setIsModalOpen(false);
    },
    [setItems],
  );

  const handleAddLegendRange = useCallback(() => {
    addItem({ name: 'New Range', min: 0, max: 100, color: '#6B7280' });
  }, [addItem]);

  const handleApplyPalette = useCallback(
    (palette: string[]) => {
      const coloredItems = legendItems.map((item, index) => ({
        ...item,
        color: samplePaletteColor(palette, index, legendItems.length),
      }));
      setItems(coloredItems);
    },
    [legendItems, setItems],
  );

  const handlePaletteSwatchClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const paletteId = e.currentTarget.dataset.paletteId;
      if (!paletteId) return;
      const colors = PALETTE_BY_ID.get(paletteId);
      if (colors) handleApplyPalette(colors);
    },
    [handleApplyPalette],
  );

  const handleLegendNameChange = useCallback(
    (id: string, name: string) => {
      updateItem(id, { name });
    },
    [updateItem],
  );

  const handleLegendMinChange = useCallback(
    (id: string, v: number | null) => {
      updateItem(id, { min: v ?? 0 });
    },
    [updateItem],
  );

  const handleLegendMaxChange = useCallback(
    (id: string, v: number | null) => {
      updateItem(id, { max: v ?? 0 });
    },
    [updateItem],
  );

  const handleLegendColorChange = useCallback(
    (id: string, color: { toHexString: () => string }) => {
      updateItem(id, { color: color.toHexString() });
    },
    [updateItem],
  );

  const handleRemoveLegendRange = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const id = e.currentTarget.dataset.id;
      if (id) {
        removeItem(id);
      }
    },
    [removeItem],
  );

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      setDraggedIndex(parseInt(index, 10));
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const index = e.currentTarget.dataset.index;
      if (index !== undefined) {
        const targetIndex = parseInt(index, 10);
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
          reorderItems(draggedIndex, targetIndex);
          setDraggedIndex(targetIndex);
        }
      }
    },
    [draggedIndex, reorderItems],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleNoDataColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setLegendStylesState({ noDataColor: color.toHexString() }),
    [setLegendStylesState],
  );

  const sortLegendTooltip = useMemo(
    () =>
      sortDirection === 'asc'
        ? t('visualizer.legendConfig.sortAscending')
        : t('visualizer.legendConfig.sortDescending'),
    [sortDirection, t],
  );

  const sortLegendIcon = useMemo(
    () => (sortDirection === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />),
    [sortDirection],
  );

  const rangesContent = (
    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Flex gap={4}>
          <Tooltip title={sortLegendTooltip}>
            <Button
              type="text"
              icon={sortLegendIcon}
              size="small"
              onClick={handleSort}
              className="text-gray-500"
              aria-label={sortLegendTooltip}
            />
          </Tooltip>
          <Tooltip title={t('visualizer.legendConfig.expandEdit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={handleOpenModal}
              className="text-gray-500"
              aria-label={t('visualizer.legendConfig.expandEditAria')}
            />
          </Tooltip>
        </Flex>
      </Flex>

      <div className={`grid ${GRID_COLS} gap-2 text-xs font-medium text-gray-500`}>
        <span />
        <Typography.Text className="text-xs text-gray-500">
          {t('visualizer.legendColumns.name')}
        </Typography.Text>
        <Typography.Text className="text-xs text-gray-500">
          {t('visualizer.legendColumns.min')}
        </Typography.Text>
        <Typography.Text className="text-xs text-gray-500">
          {t('visualizer.legendColumns.max')}
        </Typography.Text>
        <Typography.Text className="text-xs text-gray-500">
          {t('visualizer.legendColumns.color')}
        </Typography.Text>
        <span />
      </div>
      <Flex vertical>
        {legendItems.map((item, index) => (
          <LegendItemRow
            key={item.id}
            item={item}
            index={index}
            isDragged={draggedIndex === index}
            isRemoveDisabled={legendItems.length <= 1}
            gridCols={GRID_COLS}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onNameChange={handleLegendNameChange}
            onMinChange={handleLegendMinChange}
            onMaxChange={handleLegendMaxChange}
            onColorChange={handleLegendColorChange}
            onRemove={handleRemoveLegendRange}
          />
        ))}
      </Flex>

      <Tooltip title={t('visualizer.legendConfig.addRange')}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          size="small"
          onClick={handleAddLegendRange}
          className="w-full text-gray-500"
          aria-label={t('visualizer.legendConfig.addRangeAria')}
        />
      </Tooltip>
    </Flex>
  );

  const palettesContent = (
    <Flex vertical gap="small">
      <Flex align="center" gap={6}>
        <BgColorsOutlined className="text-gray-500" />
        <Typography.Text className="text-xs text-gray-500">
          {t('visualizer.legendConfig.paletteSuggestions')}
        </Typography.Text>
      </Flex>
      <Flex vertical gap={8}>
        {PALETTE_GROUPS.map((group) => (
          <Flex key={group.id} vertical gap={4}>
            <Typography.Text className="text-xs font-medium text-gray-500">
              {t(group.titleKey)}
            </Typography.Text>
            <Flex gap={6} wrap>
              {group.suggestions.map((palette) => (
                <Tooltip
                  key={palette.id}
                  title={t('visualizer.legendConfig.applyPalette', { name: palette.name })}
                >
                  <Button
                    type="default"
                    className="m-0! h-6! w-10! min-w-0! overflow-hidden! border-gray-200! p-0!"
                    data-palette-id={palette.id}
                    onClick={handlePaletteSwatchClick}
                    aria-label={t('visualizer.legendConfig.applyPalette', { name: palette.name })}
                  >
                    <Flex className="h-full w-full">
                      {palette.colors.map((color) => (
                        <span
                          key={color}
                          className="h-full flex-1"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </Flex>
                  </Button>
                </Tooltip>
              ))}
            </Flex>
          </Flex>
        ))}
      </Flex>
      <Flex align="center" justify="space-between" className="mt-4">
        <Flex align="center" gap={6}>
          <InfoCircleOutlined className="text-gray-400" />
          <Typography.Text className="text-xs text-gray-500">
            {t('visualizer.legendStyles.noDataColor')}
          </Typography.Text>
        </Flex>
        <ColorPicker value={noDataColor} onChangeComplete={handleNoDataColorChange} size="small" />
      </Flex>
    </Flex>
  );

  const collapseItems = [
    {
      key: 'ranges',
      label: (
        <Typography.Text className="font-semibold">
          {t('visualizer.legendConfig.collapseRanges')}
        </Typography.Text>
      ),
      children: rangesContent,
    },
    {
      key: 'palettes',
      label: (
        <Typography.Text className="font-semibold">
          {t('visualizer.legendConfig.collapseTheme')}
        </Typography.Text>
      ),
      children: palettesContent,
    },
  ];

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={BarChartOutlined}>
        {t('visualizer.legendConfig.sectionTitle')}
      </SectionTitle>
      <Collapse items={collapseItems} defaultActiveKey={[]} ghost expandIconPlacement="end" />

      {/* Edit Modal */}
      <Suspense fallback={null}>
        <EditLegendModal
          open={isModalOpen}
          items={legendItems}
          onSave={handleSaveFromModal}
          onCancel={handleCloseModal}
        />
      </Suspense>
    </Flex>
  );
};

export default LegendConfigPanel;
