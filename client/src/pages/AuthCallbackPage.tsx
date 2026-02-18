import { type FC, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import type { UserPublic } from '@/api/auth/types';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import {
  clearReturnUrl,
  clearTemporaryProjectState,
  getReturnUrl,
  getTemporaryProjectState,
  mergeTemporaryStateWithDefaults,
} from '@/helpers/temporaryProjectState';

const AuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useProfileStore(selectSetUser);

  useEffect(() => {
    const userParam = searchParams.get('user');

    if (userParam) {
      try {
        const user = JSON.parse(atob(userParam)) as UserPublic;
        setUser(user);

        // Restore temporary project state: merge partial with defaults, then apply
        const partial = getTemporaryProjectState();
        if (partial && Object.keys(partial).length > 0) {
          const merged = mergeTemporaryStateWithDefaults(partial);
          const { setVisualizerState } = useVisualizerStore.getState();
          const { setMapStylesState } = useMapStylesStore.getState();
          const { setLegendStylesState } = useLegendStylesStore.getState();
          const { setItems } = useLegendDataStore.getState();

          setVisualizerState({
            selectedRegionId: merged.selectedRegionId,
            importDataType: merged.importDataType,
            data: merged.data,
            timelineData: merged.timelineData,
            timePeriods: merged.timePeriods,
            activeTimePeriod: merged.activeTimePeriod,
          });
          setMapStylesState({
            border: merged.border,
            shadow: merged.shadow,
            zoomControls: merged.zoomControls,
            picture: merged.picture,
            regionLabels: merged.regionLabels,
          });
          setLegendStylesState({
            labels: merged.labels,
            title: merged.title,
            position: merged.position,
            floatingPosition: merged.floatingPosition,
            floatingSize: merged.floatingSize,
            backgroundColor: merged.backgroundColor,
            noDataColor: merged.noDataColor,
          });
          setItems(merged.items.allIds.map((id) => merged.items.byId[id]));

          clearTemporaryProjectState();
        }

        // Redirect to return URL or home
        const returnUrl = getReturnUrl();
        if (returnUrl) {
          clearReturnUrl();
          navigate(returnUrl, { replace: true });
        } else {
          navigate(ROUTES.HOME, { replace: true });
        }
      } catch {
        setUser(null);
        navigate(ROUTES.HOME, { replace: true });
      }
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [navigate, searchParams, setUser]);

  return (
    <Flex align="center" justify="center" className="h-full w-full">
      <Spin size="large" />
    </Flex>
  );
};

export default AuthCallbackPage;
