import { create } from 'zustand';
import type { LegendDataState, LegendItem } from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_ITEMS: LegendItem[] = [
  { id: generateId(), name: 'Low', min: 0, max: 100, color: '#93C5FD' },
  { id: generateId(), name: 'Medium', min: 101, max: 500, color: '#3B82F6' },
  { id: generateId(), name: 'High', min: 501, max: 1000, color: '#1E3A5F' },
];

const createItemsState = (items: LegendItem[]) => ({
  allIds: items.map((item) => item.id),
  byId: Object.fromEntries(items.map((item) => [item.id, item])),
});

export const useLegendDataStore = create<LegendDataState>((set) => ({
  items: createItemsState(DEFAULT_ITEMS),

  setLegendDataState: (data) => set((state) => ({ ...state, ...data })),

  setItems: (items) => set(() => ({ items: createItemsState(items) })),

  addItem: (item) =>
    set((state) => {
      const id = generateId();
      const newItem: LegendItem = { ...item, id };
      return {
        items: {
          allIds: [...state.items.allIds, id],
          byId: { ...state.items.byId, [id]: newItem },
        },
      };
    }),

  updateItem: (id, data) =>
    set((state) => ({
      items: {
        ...state.items,
        byId: {
          ...state.items.byId,
          [id]: { ...state.items.byId[id], ...data },
        },
      },
    })),

  removeItem: (id) =>
    set((state) => {
      const { [id]: _, ...byId } = state.items.byId;
      return {
        items: {
          allIds: state.items.allIds.filter((itemId) => itemId !== id),
          byId,
        },
      };
    }),

  reorderItems: (fromIndex, toIndex) =>
    set((state) => {
      const allIds = [...state.items.allIds];
      const [removed] = allIds.splice(fromIndex, 1);
      allIds.splice(toIndex, 0, removed);
      return { items: { ...state.items, allIds } };
    }),

  sortItems: (direction) =>
    set((state) => {
      const sorted = [...state.items.allIds].sort((a, b) => {
        const itemA = state.items.byId[a];
        const itemB = state.items.byId[b];
        return direction === 'asc' ? itemA.min - itemB.min : itemB.min - itemA.min;
      });
      return { items: { ...state.items, allIds: sorted } };
    }),
}));

// Selectors
export const selectLegendItems = (state: LegendDataState) => state.items;
export const selectAddItem = (state: LegendDataState) => state.addItem;
export const selectUpdateItem = (state: LegendDataState) => state.updateItem;
export const selectRemoveItem = (state: LegendDataState) => state.removeItem;
export const selectReorderItems = (state: LegendDataState) => state.reorderItems;
export const selectSortItems = (state: LegendDataState) => state.sortItems;
export const selectSetItems = (state: LegendDataState) => state.setItems;
export const selectSetLegendDataState = (state: LegendDataState) => state.setLegendDataState;
