import { Grid } from 'antd';

/** `true` when viewport is at least Ant Design's `md` breakpoint (aligns with Tailwind `md`). */
export const useIsMdUp = (): boolean => {
  const screens = Grid.useBreakpoint();
  return screens.md === true;
};
