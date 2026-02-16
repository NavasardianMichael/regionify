import type { ComponentType, PropsWithChildren } from 'react';
import { Card as AntdCard, type CardProps } from 'antd';

/** Typed Card re-export for antd v6 + React 19 (CardInterface JSX compatibility). */
export const Card = AntdCard as ComponentType<PropsWithChildren<CardProps>>;
