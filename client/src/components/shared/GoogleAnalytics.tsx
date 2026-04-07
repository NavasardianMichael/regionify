import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isEmbedPathname } from '@/constants/routes';
import { getGaMeasurementId, initGa4, trackGa4PageView } from '@/helpers/analytics';

/**
 * GA4 route tracking for the main app only. Public embed routes (`/embed/:token`) are excluded.
 * Must render under `BrowserRouter`.
 */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (isEmbedPathname(location.pathname)) return;

    const id = getGaMeasurementId();
    if (!id) return;

    initGa4(id);

    const pathKey = `${location.pathname}${location.search}`;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      trackGa4PageView(pathKey);
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);

  return null;
}
