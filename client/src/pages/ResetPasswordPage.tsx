import { type FC, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AUTH_VALIDATION } from '@regionify/shared';
import { Button, Card, Form, Input, Typography } from 'antd';
import { resetPassword } from '@/api/auth';
import { ROUTES } from '@/constants/routes';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { AppNavLink } from '@/components/ui/AppNavLink';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage: FC = () => {
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<ResetPasswordFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = useAppFeedback();

  const token = useMemo(() => searchParams.get('token'), [searchParams]);

  if (!token) {
    return (
      <Card className="mx-auto! w-full max-w-144! shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary text-xl font-bold">
            Invalid Reset Link
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">
            No reset token provided. Please request a new password reset link.
          </Typography.Paragraph>
          <AppNavLink to={ROUTES.FORGOT_PASSWORD}>
            <Button type="primary" className="mt-4">
              Request New Link
            </Button>
          </AppNavLink>
        </div>
      </Card>
    );
  }

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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary text-xl font-bold">
            Password Reset Successfully
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">
            Your password has been updated. You can now log in with your new password.
          </Typography.Paragraph>
          <AppNavLink to={ROUTES.LOGIN}>
            <Button type="primary" className="mt-4">
              Go to Login
            </Button>
          </AppNavLink>
        </div>
      </Card>
    );
  }

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    try {
      await resetPassword({ token, password: values.password });
      setSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      message.error(errorMessage, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto! w-full max-w-144! shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary text-2xl font-bold">
          Reset Password
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Enter your new password below.
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="password"
          label={
            <Typography.Text className="font-medium text-gray-700">New Password</Typography.Text>
          }
          rules={[
            { required: true, message: AUTH_VALIDATION.password.messages.required },
            {
              min: AUTH_VALIDATION.password.minLength,
              message: AUTH_VALIDATION.password.messages.minLength,
            },
            {
              max: AUTH_VALIDATION.password.maxLength,
              message: AUTH_VALIDATION.password.messages.maxLength,
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
          <Input.Password placeholder="Enter new password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={
            <Typography.Text className="font-medium text-gray-700">
              Confirm Password
            </Typography.Text>
          }
          dependencies={['password']}
          rules={[
            { required: true, message: AUTH_VALIDATION.confirmPassword.messages.required },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(AUTH_VALIDATION.confirmPassword.messages.mismatch));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" block loading={loading}>
            Reset Password
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ResetPasswordPage;
