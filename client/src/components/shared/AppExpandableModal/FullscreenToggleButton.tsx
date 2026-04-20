import { type FC } from 'react';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

type Props = {
  isFullscreen: boolean;
  enterLabel: string;
  exitLabel: string;
  onToggle: () => void;
};

export const FullscreenToggleButton: FC<Props> = ({
  isFullscreen,
  enterLabel,
  exitLabel,
  onToggle,
}) => {
  const label = isFullscreen ? exitLabel : enterLabel;
  const Icon = isFullscreen ? FullscreenExitOutlined : FullscreenOutlined;

  return (
    <Tooltip title={label}>
      <Button
        type="text"
        aria-label={label}
        className="-translate-x-5.5 translate-y-[-4px]"
        onClick={onToggle}
        icon={<Icon className="text-gray-500!" />}
      />
    </Tooltip>
  );
};
