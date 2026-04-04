import { type FC, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_VALIDATION } from '@regionify/shared';
import { Button, Card, Divider, Form, Input, Typography } from 'antd';
import { login, resendVerificationEmail } from '@/api/auth';
import { AUTH_ENDPOINTS } from '@/api/auth/endpoints';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  clearReturnUrl,
  clearTemporaryProjectState,
  getReturnUrl,
  getTemporaryProjectState,
  mergeTemporaryStateWithDefaults,
} from '@/helpers/temporaryProjectState';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { AppNavLink } from '@/components/ui/AppNavLink';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage: FC = () => {
  const { t } = useTypedTranslation();
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { message } = useAppFeedback();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useProfileStore(selectSetUser);

  const errorParam = searchParams.get('error');
  const urlError = useMemo<string | null>(() => {
    if (errorParam === 'session_limit') return t('messages.sessionLimitReached');
    if (errorParam === 'google_auth_failed' || errorParam === 'session_error') {
      return t('messages.googleAuthFailed');
    }
    return null;
  }, [errorParam, t]);

  const displayError = loginError ?? urlError;

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setLoginError(null);
    try {
      const response = await login(values);
      setUser(response.user);

      // Restore temporary project state: merge partial with defaults, then apply
      const partial = getTemporaryProjectState();
      if (partial && Object.keys(partial).length > 0) {
        const merged = mergeTemporaryStateWithDefaults(partial);
        const { setVisualizerState } = useVisualizerStore.getState();
        const { setMapStylesState } = useMapStylesStore.getState();
        const { setLegendStylesState } = useLegendStylesStore.getState();
        const { setItems } = useLegendDataStore.getState();

        setVisualizerState({
          selectedCountryId: merged.selectedCountryId,
          importDataType: merged.importDataType,
          data: merged.data,
          google: merged.google,
          timelineData: merged.timelineData,
          timePeriods: merged.timePeriods,
          activeTimePeriod: merged.activeTimePeriod,
          isGoogleSheetSyncLoading: false,
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

      message.success(t('messages.loggedInSuccess'), 5);

      // Redirect to return URL or home
      const returnUrl = getReturnUrl();
      if (returnUrl) {
        clearReturnUrl();
        navigate(returnUrl, { replace: true });
      } else {
        navigate(ROUTES.HOME);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('messages.loginFailed');
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isUnverifiedError = loginError?.includes('verify your email');

  const handleResendVerification = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.error(t('messages.enterEmail'), 0);
      return;
    }
    setResendLoading(true);
    try {
      const result = await resendVerificationEmail(email);
      message.success(result.message, 5);
    } catch {
      message.error(t('messages.resendVerificationFailed'), 0);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="m-auto! w-full max-w-144! shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary text-2xl font-bold">
          {t('auth.login.title')}
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          {t('auth.login.subtitle')}
        </Typography.Paragraph>
      </div>

      <Button
        block
        onClick={() => (window.location.href = AUTH_ENDPOINTS.google)}
        className="mb-4 flex! items-center justify-center gap-3 border-gray-300 bg-white! text-gray-700 hover:bg-gray-50!"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
          />
        </svg>
        {t('auth.login.continueGoogle')}
      </Button>

      <Divider plain className="text-gray-400!">
        {t('auth.login.dividerEmail')}
      </Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={() => setLoginError(null)}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label={
            <Typography.Text className="font-medium text-gray-700">
              {t('account.email')}
            </Typography.Text>
          }
          rules={[
            { required: true, message: AUTH_VALIDATION.email.messages.required },
            { type: 'email', message: AUTH_VALIDATION.email.messages.invalid },
          ]}
        >
          <Input placeholder={t('auth.login.emailPlaceholder')} autoComplete="username" />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <Typography.Text className="font-medium text-gray-700">
              {t('auth.login.password')}
            </Typography.Text>
          }
          rules={[{ required: true, message: AUTH_VALIDATION.password.messages.required }]}
        >
          <Input.Password
            placeholder={t('auth.login.passwordPlaceholder')}
            autoComplete="current-password"
          />
        </Form.Item>

        {displayError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {displayError}
            {isUnverifiedError && (
              <div className="mt-2">
                <Button
                  type="link"
                  size="small"
                  onClick={handleResendVerification}
                  loading={resendLoading}
                  className="h-auto! p-0!"
                >
                  {t('auth.login.resendVerification')}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 text-right">
          <AppNavLink to={ROUTES.FORGOT_PASSWORD} className="text-sm font-semibold">
            {t('auth.login.forgotPassword')}
          </AppNavLink>
        </div>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={loading}>
            {t('auth.login.signIn')}
          </Button>
        </Form.Item>

        <div className="text-center">
          {t('auth.login.noAccount')}{' '}
          <AppNavLink to={ROUTES.SIGN_UP} className="font-semibold hover:underline">
            {t('auth.login.signUpLink')}
          </AppNavLink>
        </div>
      </Form>
    </Card>
  );
};

export default LoginPage;
