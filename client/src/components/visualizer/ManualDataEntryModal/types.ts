export type ColumnFilterKey = 'id' | 'label' | 'value' | 'time';

export type ColumnFilters = Record<ColumnFilterKey, string>;

export type MiddleColKey = ColumnFilterKey;

export const EMPTY_FILTERS: ColumnFilters = { id: '', label: '', value: '', time: '' };
