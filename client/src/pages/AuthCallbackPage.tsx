import { type FC, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import type { UserPublic } from '@/api/auth/types';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import {
  clearReturnUrl,
  clearTemporaryProjectState,
  getReturnUrl,
  getTemporaryProjectState,
} from '@/helpers/temporaryProjectState';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';

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

        // Restore temporary project state if it exists
        const tempState = getTemporaryProjectState();
        if (tempState) {
          const { setVisualizerState } = useVisualizerStore.getState();
          const { setMapStylesState } = useMapStylesStore.getState();
          const { setLegendStylesState } = useLegendStylesStore.getState();
          const { setItems } = useLegendDataStore.getState();

          // Restore visualizer state
          setVisualizerState({
            selectedRegionId: tempState.selectedRegionId,
            importDataType: tempState.dataset?.importDataType ?? IMPORT_DATA_TYPES.csv,
            data: tempState.dataset
              ? {
                  allIds: tempState.dataset.allIds,
                  byId: tempState.dataset.byId as Record<string, { id: string; label: string; value: number }>,
                }
              : { allIds: [], byId: {} },
          });

          // Restore map styles
          setMapStylesState(tempState.mapStyles);

          // Restore legend styles
          setLegendStylesState(tempState.legendStyles);

          // Restore legend data
          if (tempState.legendData?.items) {
            setItems(tempState.legendData.items);
          }

          // Clear temporary state
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
