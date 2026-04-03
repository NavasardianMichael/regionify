import type { ComponentType, PropsWithChildren } from 'react';
import type { CardProps } from 'antd';
import InternalCard from 'antd/es/card';

/** Subpath import preserves `Meta` on the component type (barrel export loses static members). */
export const CardMeta = InternalCard.Meta;

/** Typed Card re-export for antd v6 + React 19 (CardInterface JSX compatibility). */
export const Card = InternalCard as ComponentType<PropsWithChildren<CardProps>>;
