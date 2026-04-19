import { lazy } from 'react';

export const TableView = lazy(() => import('./TableView').then((m) => ({ default: m.TableView })));
