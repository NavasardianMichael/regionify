import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AUTH_VALIDATION } from '@regionify/shared';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { forgotPassword } from '@/api/auth';
import { ROUTES } from '@/constants/routes';

type ForgotPasswordFormValues = {
  email: string;
};

const ForgotPasswordPage: FC = () => {
  const [form] = Form.useForm<ForgotPasswordFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await forgotPassword(values);
      setSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      message.error(errorMessage);
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Typography.Title level={2} className="text-primary text-xl font-bold">
            Check Your Email
          </Typography.Title>
          <Typography.Paragraph className="mt-2 text-gray-500">
            We&apos;ve sent a password reset link to your email address. Please check your inbox and
            follow the instructions.
          </Typography.Paragraph>
          <Link to={ROUTES.LOGIN}>
            <Button type="primary" className="mt-4">
              Back to Login
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto! w-full max-w-144! shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary text-2xl font-bold">
          Forgot Password
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="email"
          label={<Typography.Text className="font-medium text-gray-700">Email</Typography.Text>}
          rules={[
            { required: true, message: AUTH_VALIDATION.email.messages.required },
            { type: 'email', message: AUTH_VALIDATION.email.messages.invalid },
          ]}
        >
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={loading}>
            Send Reset Link
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link
            to={ROUTES.LOGIN}
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeftOutlined />
            Back to Login
          </Link>
        </div>
      </Form>
    </Card>
  );
};

export default ForgotPasswordPage;
