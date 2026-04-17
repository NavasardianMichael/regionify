import { Grid } from 'antd';

/** `true` at Ant Design `lg` (992px+) — use for layouts that need full horizontal nav without crowding. */
export const useIsLgUp = (): boolean => {
  const screens = Grid.useBreakpoint();
  return screens.lg === true;
};
