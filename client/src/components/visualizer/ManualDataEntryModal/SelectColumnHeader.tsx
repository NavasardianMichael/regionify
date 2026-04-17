import { type Dispatch, type FC, type Key, type SetStateAction, useCallback } from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Checkbox, Dropdown, Flex } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

type SelectColumnHeaderProps = {
  selectAllLabel: string;
  bulkActionsLabel: string;
  visibleRowKeys: string[];
  selectedVisibleCount: number;
  bulkMenuItems: MenuProps['items'];
  onBulkMenuClick: NonNullable<MenuProps['onClick']>;
  bulkDisabled: boolean;
  setSelectedRowKeys: Dispatch<SetStateAction<Key[]>>;
};

export const SelectColumnHeader: FC<SelectColumnHeaderProps> = ({
  selectAllLabel,
  bulkActionsLabel,
  visibleRowKeys,
  selectedVisibleCount,
  bulkMenuItems,
  onBulkMenuClick,
  bulkDisabled,
  setSelectedRowKeys,
}) => {
  const onSelectAllChange = useCallback(
    (e: CheckboxChangeEvent) => {
      if (e.target.checked) {
        setSelectedRowKeys((prev) => {
          const set = new Set(prev.map(String));
          visibleRowKeys.forEach((k) => set.add(k));
          return [...set];
        });
      } else {
        setSelectedRowKeys((prev) => prev.filter((k) => !visibleRowKeys.includes(String(k))));
      }
    },
    [visibleRowKeys, setSelectedRowKeys],
  );

  return (
    <Flex align="center" justify="flex-start" wrap="nowrap" className="min-w-0 gap-0.5 px-1">
      <Checkbox
        checked={visibleRowKeys.length > 0 && selectedVisibleCount === visibleRowKeys.length}
        indeterminate={selectedVisibleCount > 0 && selectedVisibleCount < visibleRowKeys.length}
        aria-label={selectAllLabel}
        onChange={onSelectAllChange}
      />
      <Dropdown menu={{ items: bulkMenuItems, onClick: onBulkMenuClick }} trigger={['click']}>
        <Button
          type="text"
          size="small"
          icon={<DownOutlined />}
          disabled={bulkDisabled}
          aria-label={bulkActionsLabel}
          className="size-7 shrink-0 p-0"
        />
      </Dropdown>
    </Flex>
  );
};
