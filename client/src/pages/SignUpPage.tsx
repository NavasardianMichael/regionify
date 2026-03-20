import { type FC, useState } from 'react';
import { AUTH_VALIDATION } from '@regionify/shared';
import { Button, Card, Divider, Flex, Form, Input, Typography } from 'antd';
import { register } from '@/api/auth';
import { AUTH_ENDPOINTS } from '@/api/auth/endpoints';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUpPage: FC = () => {
  const { t } = useTypedTranslation();
  const [form] = Form.useForm<SignUpFormValues>();
  const [loading, setLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values: SignUpFormValues) => {
    setLoading(true);
    setSignUpError(null);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('messages.signUpFailed');
      setSignUpError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mx-auto! w-full max-w-144! shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary text-xl font-bold">
            {t('auth.signUp.verifyTitle')}
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">
            {t('auth.signUp.verifyBody')}
          </Typography.Paragraph>
          <Typography.Paragraph className="text-sm text-gray-400">
            {t('auth.signUp.verifyNote')}
          </Typography.Paragraph>
          <AppNavLink to={ROUTES.LOGIN}>
            <Button type="primary" className="mt-4">
              {t('auth.signUp.goToLogin')}
            </Button>
          </AppNavLink>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto! w-full max-w-144! shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary mb-0! text-2xl font-bold">
          {t('auth.signUp.title')}
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          {t('auth.signUp.subtitle')}
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
        {t('auth.signUp.continueGoogle')}
      </Button>

      <Divider plain className="text-gray-400!">
        {t('auth.signUp.dividerEmail')}
      </Divider>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={() => setSignUpError(null)}
        requiredMark={false}
      >
        <Flex vertical gap={16}>
          <Form.Item
            name="name"
            label={
              <Typography.Text className="font-medium text-gray-700">
                {t('auth.signUp.fullName')}
              </Typography.Text>
            }
            className="mb-0!"
            rules={[
              { required: true, message: AUTH_VALIDATION.name.messages.required },
              {
                min: AUTH_VALIDATION.name.minLength,
                message: AUTH_VALIDATION.name.messages.minLength,
              },
              {
                pattern: AUTH_VALIDATION.name.pattern,
                message: AUTH_VALIDATION.name.messages.pattern,
              },
            ]}
          >
            <Input placeholder={t('auth.signUp.fullNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <Typography.Text className="font-medium text-gray-700">
                {t('account.email')}
              </Typography.Text>
            }
            className="mb-0!"
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
                {t('auth.signUp.password')}
              </Typography.Text>
            }
            className="mb-0!"
            rules={[
              { required: true, message: AUTH_VALIDATION.password.messages.required },
              {
                min: AUTH_VALIDATION.password.minLength,
                message: AUTH_VALIDATION.password.messages.minLength,
              },
              {
                pattern: AUTH_VALIDATION.password.patterns.lowercase,
                message: AUTH_VALIDATION.password.messages.lowercase,
              },
              {
                pattern: AUTH_VALIDATION.password.patterns.uppercase,
                message: AUTH_VALIDATION.password.messages.uppercase,
              },
              {
                pattern: AUTH_VALIDATION.password.patterns.number,
                message: AUTH_VALIDATION.password.messages.number,
              },
            ]}
          >
            <Input.Password
              placeholder={t('auth.signUp.createPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={
              <Typography.Text className="font-medium text-gray-700">
                {t('auth.signUp.confirmPassword')}
              </Typography.Text>
            }
            className="mb-0!"
            dependencies={['password']}
            rules={[
              { required: true, message: AUTH_VALIDATION.confirmPassword.messages.required },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(AUTH_VALIDATION.confirmPassword.messages.mismatch),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </Form.Item>
        </Flex>

        {signUpError && (
          <Flex
            justify="space-between"
            align="center"
            className="mt-4! rounded-md bg-red-50 p-2! text-sm text-red-600"
          >
            {signUpError}
            {signUpError.toLowerCase().includes('account with this email already exists') && (
              <AppNavLink to={ROUTES.FORGOT_PASSWORD} className="text-sm font-semibold">
                {t('auth.signUp.forgotPassword')}
              </AppNavLink>
            )}
          </Flex>
        )}

        <Flex gap={8} className="mt-8!" vertical>
          <Form.Item className="mb-0!">
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t('auth.signUp.createAccount')}
            </Button>
          </Form.Item>

          <div className="text-center text-gray-600">
            {t('auth.signUp.alreadyHaveAccount')}{' '}
            <AppNavLink to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
              {t('auth.signUp.signInLink')}
            </AppNavLink>
          </div>
        </Flex>
      </Form>
    </Card>
  );
};

export default SignUpPage;
