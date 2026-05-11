import type { FC, PropsWithChildren } from 'react';
import { Button, type ButtonProps } from 'antd';

type AppButtonStyleLinkProps = Omit<ButtonProps, 'href'> & {
  href: string;
};

export const AppButtonStyleLink: FC<PropsWithChildren<AppButtonStyleLinkProps>> = ({
  href,
  children,
  ...props
}) => (
  <Button href={href} {...props}>
    {children}
  </Button>
);
