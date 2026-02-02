import { type FC, useMemo } from 'react';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { Flex, Typography } from 'antd';
import type { TitleProps } from 'antd/es/typography/Title';

type Props = TitleProps & {
  IconComponent?: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
};

export const SectionTitle: FC<Props> = ({ className, children, IconComponent, ...props }) => {
  const computedClassName = useMemo(() => {
    return `text-primary text-base! mb-0! font-semibold ${className ?? ''}`;
  }, [className]);

  return (
    <Flex align="center" gap="small">
      {IconComponent && <IconComponent className="text-primary text-lg" />}
      <Typography.Title level={3} className={computedClassName} {...props}>
        {children}
      </Typography.Title>
    </Flex>
  );
};
