export type LegendItem = {
  id: string;
  name: string;
  min: number;
  max: number;
  color: string;
};

export type LegendDataState = {
  // State
  items: {
    allIds: LegendItem['id'][];
    byId: Record<LegendItem['id'], LegendItem>;
  };

  // Actions
  setLegendDataState: (data: Partial<LegendDataState>) => void;
  setItems: (items: LegendItem[]) => void;
  addItem: (item: Omit<LegendItem, 'id'>) => void;
  updateItem: (id: string, data: Partial<Omit<LegendItem, 'id'>>) => void;
  removeItem: (id: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  sortItems: (direction: 'asc' | 'desc') => void;
};
