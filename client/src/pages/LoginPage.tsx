import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_VALIDATION } from '@regionify/shared';
import { App, Button, Card, Divider, Form, Input, Typography } from 'antd';
import { login, resendVerificationEmail } from '@/api/auth';
import { AUTH_ENDPOINTS } from '@/api/auth/endpoints';
import { AppNavLink } from '@/components/ui/AppNavLink';
import { ROUTES } from '@/constants/routes';
import {
  clearReturnUrl,
  clearTemporaryProjectState,
  getReturnUrl,
  getTemporaryProjectState,
  mergeTemporaryStateWithDefaults,
} from '@/helpers/temporaryProjectState';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage: FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const setUser = useProfileStore(selectSetUser);

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

      message.success('Logged in successfully!');

      // Redirect to return URL or home
      const returnUrl = getReturnUrl();
      if (returnUrl) {
        clearReturnUrl();
        navigate(returnUrl, { replace: true });
      } else {
        navigate(ROUTES.HOME);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isUnverifiedError = loginError?.includes('verify your email');

  const handleResendVerification = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.error('Please enter your email address.');
      return;
    }
    setResendLoading(true);
    try {
      const result = await resendVerificationEmail(email);
      message.success(result.message);
    } catch {
      message.error('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="mx-auto! w-full max-w-144! shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary text-2xl font-bold">
          Welcome Back
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Sign in to your account to continue
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
        Continue with Google
      </Button>

      <Divider plain className="text-gray-400!">
        or sign in with email
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
          label={<Typography.Text className="font-medium text-gray-700">Email</Typography.Text>}
          rules={[
            { required: true, message: AUTH_VALIDATION.email.messages.required },
            { type: 'email', message: AUTH_VALIDATION.email.messages.invalid },
          ]}
        >
          <Input placeholder="email@example.com" autoComplete="username" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<Typography.Text className="font-medium text-gray-700">Password</Typography.Text>}
          rules={[{ required: true, message: AUTH_VALIDATION.password.messages.required }]}
        >
          <Input.Password placeholder="Enter your password" autoComplete="current-password" />
        </Form.Item>

        {loginError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {loginError}
            {isUnverifiedError && (
              <div className="mt-2">
                <Button
                  type="link"
                  size="small"
                  onClick={handleResendVerification}
                  loading={resendLoading}
                  className="h-auto! p-0!"
                >
                  Resend verification email
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 text-right">
          <AppNavLink to={ROUTES.FORGOT_PASSWORD} className="text-sm font-semibold">
            Forgot password?
          </AppNavLink>
        </div>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign In
          </Button>
        </Form.Item>

        <div className="text-center">
          Don&apos;t have an account?{' '}
          <AppNavLink to={ROUTES.SIGN_UP} className="font-semibold hover:underline">
            Sign up
          </AppNavLink>
        </div>
      </Form>
    </Card>
  );
};

export default LoginPage;
