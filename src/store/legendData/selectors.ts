import type { LegendDataState } from './types';

// State selectors
export const selectItems = (state: LegendDataState) => state.items;
export const selectItemsAllIds = (state: LegendDataState) => state.items.allIds;
export const selectItemsById = (state: LegendDataState) => state.items.byId;

// Derived selectors
export const selectItemsList = (state: LegendDataState) =>
  state.items.allIds.map((id) => state.items.byId[id]);
export const selectItemById = (id: string) => (state: LegendDataState) => state.items.byId[id];
export const selectItemsCount = (state: LegendDataState) => state.items.allIds.length;

// Action selectors
export const selectAddItem = (state: LegendDataState) => state.addItem;
export const selectUpdateItem = (state: LegendDataState) => state.updateItem;
export const selectRemoveItem = (state: LegendDataState) => state.removeItem;
export const selectReorderItems = (state: LegendDataState) => state.reorderItems;
export const selectSortItems = (state: LegendDataState) => state.sortItems;
export const selectSetLegendDataState = (state: LegendDataState) => state.setLegendDataState;
