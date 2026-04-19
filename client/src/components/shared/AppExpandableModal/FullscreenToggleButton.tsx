import { type FC } from 'react';
import { ArrowsAltOutlined, ShrinkOutlined } from '@ant-design/icons';
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

  return (
    <Tooltip title={label}>
      <Button
        type="text"
        aria-label={label}
        className="translate-x-[-22px] translate-y-[-4px]"
        onClick={onToggle}
        icon={
          isFullscreen ? (
            <ShrinkOutlined className="text-gray-500!" />
          ) : (
            <ArrowsAltOutlined className="text-gray-500!" />
          )
        }
      />
    </Tooltip>
  );
};
