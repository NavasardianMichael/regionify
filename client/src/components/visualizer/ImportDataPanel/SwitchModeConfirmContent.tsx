import { type FC } from 'react';
import { Flex, Typography } from 'antd';

/**
 * Static content for the "switch to static/dynamic" confirm modal in Import Data panel.
 */
export const SwitchModeConfirmContent: FC = () => (
  <Flex vertical gap="small">
    <Typography.Text>All changes to your dataset will be lost. Are you sure?</Typography.Text>
    <Typography.Text type="secondary" className="text-xs">
      We recommend saving your current project first, then creating a new one if you need to keep
      this data.
    </Typography.Text>
  </Flex>
);
