import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectIsLoggedIn } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { captureFullTemporaryProjectState } from '@/helpers/captureFullTemporaryProjectState';
import {
  buildPartialTemporaryState,
  saveTemporaryProjectState,
} from '@/helpers/temporaryProjectState';

const DEBOUNCE_MS = 2000;

/** Persists visualizer edits while guest is on `/projects/new` (refreshes TTL). */
export function useGuestDraftAutosave(): void {
  const location = useLocation();
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (location.pathname !== ROUTES.PROJECT_NEW || isLoggedIn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const full = captureFullTemporaryProjectState();
        const partial = buildPartialTemporaryState(full);
        saveTemporaryProjectState(partial);
      }, DEBOUNCE_MS);
    };

    const unsubs = [
      useVisualizerStore.subscribe(schedule),
      useMapStylesStore.subscribe(schedule),
      useLegendStylesStore.subscribe(schedule),
      useLegendDataStore.subscribe(schedule),
    ];
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubs.forEach((u) => u());
    };
  }, [location.pathname, isLoggedIn]);
}
