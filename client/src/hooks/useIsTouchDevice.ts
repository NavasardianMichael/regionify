import { useEffect, useState } from 'react';

/** `true` when the device has any coarse (touch) input, including hybrid mouse+touch devices. */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(() => window.matchMedia('(any-pointer: coarse)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(any-pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isTouch;
};
