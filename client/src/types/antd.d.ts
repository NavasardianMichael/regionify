// Fix for antd v6 + React 19 type compatibility: CardInterface is not a valid JSX element type.
// Augment antd so Card is typed as a valid React component.

import type { ComponentType, PropsWithChildren } from 'react';
import type { CardProps } from 'antd';

declare module 'antd' {
  export const Card: ComponentType<PropsWithChildren<CardProps>>;
}
