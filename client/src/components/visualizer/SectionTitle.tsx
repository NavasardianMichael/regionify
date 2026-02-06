import { type ComponentType, type FC, useMemo } from 'react';
import { Flex, Typography } from 'antd';
import type { TitleProps } from 'antd/es/typography/Title';

type Props = TitleProps & {
  IconComponent?: ComponentType<{ className?: string }>;
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
