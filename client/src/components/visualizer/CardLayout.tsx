import { type FC, useMemo } from 'react';
import { Flex, type FlexProps } from 'antd';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';

type Props = FlexProps;

export const CardLayout: FC<Props> = ({ className, children, ...props }) => {
  const computedClassName = useMemo(() => {
    return `scrollbar-thin overflow-y-auto bg-white ${APP_LAYOUT_CLASSNAMES.padding} ${className ?? ''}`;
  }, [className]);

  return (
    <Flex vertical className={computedClassName} {...props}>
      {children}
    </Flex>
  );
};
