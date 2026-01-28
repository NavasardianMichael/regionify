import { create } from 'zustand';
import type {
  DataImportType,
  JurisdictionOption,
  LegendItem,
  RegionData,
} from '@/types/visualizer';

type VisualizerState = {
  // Data import
  importType: DataImportType;
  regionData: RegionData[];

  // Legend configuration
  legendItems: LegendItem[];

  // Map selection
  selectedJurisdiction: JurisdictionOption | null;

  // Actions
  setImportType: (type: DataImportType) => void;
  setRegionData: (data: RegionData[]) => void;
  setLegendItems: (items: LegendItem[]) => void;
  addLegendItem: () => void;
  updateLegendItem: (id: string, updates: Partial<Omit<LegendItem, 'id'>>) => void;
  removeLegendItem: (id: string) => void;
  reorderLegendItems: (fromIndex: number, toIndex: number) => void;
  sortLegendItems: (direction: 'asc' | 'desc') => void;
  setSelectedJurisdiction: (jurisdiction: JurisdictionOption | null) => void;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_LEGEND_ITEMS: LegendItem[] = [
  { id: generateId(), name: 'Low', min: 0, max: 100, color: '#93C5FD' },
  { id: generateId(), name: 'Medium', min: 101, max: 500, color: '#3B82F6' },
  { id: generateId(), name: 'High', min: 501, max: 1000, color: '#1E3A5F' },
];

export const useVisualizerStore = create<VisualizerState>((set) => ({
  importType: 'csv',
  regionData: [],
  legendItems: DEFAULT_LEGEND_ITEMS,
  selectedJurisdiction: null,

  setImportType: (type) => set({ importType: type }),

  setRegionData: (data) => set({ regionData: data }),

  setLegendItems: (items) => set({ legendItems: items }),

  addLegendItem: () =>
    set((state) => ({
      legendItems: [
        ...state.legendItems,
        {
          id: generateId(),
          name: 'New',
          min: 0,
          max: 100,
          color: '#6B7280',
        },
      ],
    })),

  updateLegendItem: (id, updates) =>
    set((state) => ({
      legendItems: state.legendItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    })),

  removeLegendItem: (id) =>
    set((state) => ({
      legendItems: state.legendItems.filter((item) => item.id !== id),
    })),

  reorderLegendItems: (fromIndex, toIndex) =>
    set((state) => {
      const items = [...state.legendItems];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return { legendItems: items };
    }),

  sortLegendItems: (direction) =>
    set((state) => ({
      legendItems: [...state.legendItems].sort((a, b) =>
        direction === 'asc' ? a.min - b.min : b.min - a.min,
      ),
    })),

  setSelectedJurisdiction: (jurisdiction) => set({ selectedJurisdiction: jurisdiction }),
}));
