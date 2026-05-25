import type { FC } from 'react';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { TextFilterBody } from './TextFilterBody';
import type { ColumnFilterKey } from './types';
import type { ModalState } from './useModalState';

type ColumnFilterDropdownProps = FilterDropdownProps & {
  columnKey: ColumnFilterKey;
  placeholder: string;
  setColumnFilters: ModalState['setColumnFilters'];
  filtersRef: ModalState['columnFiltersRef'];
};

export const ColumnFilterDropdown: FC<ColumnFilterDropdownProps> = ({
  visible,
  columnKey,
  placeholder,
  setColumnFilters,
  filtersRef,
}) => (
  <TextFilterBody
    columnKey={columnKey}
    visible={visible}
    setColumnFilters={setColumnFilters}
    placeholder={placeholder}
    filtersRef={filtersRef}
  />
);
