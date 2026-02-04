// Fix for antd v6 + React 19 type compatibility issue
// The CardInterface type doesn't extend React.FC properly
// This augments the antd module to fix the JSX type error

import type { FC, PropsWithChildren } from 'react';
import type { CardProps } from 'antd';

declare module 'antd' {
  export const Card: FC<PropsWithChildren<CardProps>>;
}
