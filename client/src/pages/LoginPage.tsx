import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { login } from '@/api/auth';
import { ROUTES } from '@/constants/routes';
import { AppNavLink } from '@/components/ui/AppNavLink';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage: FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Logged in successfully!');
      navigate(ROUTES.HOME);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      message.error(errorMessage);
    } finally {
      setLoading(false);
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

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="email"
          label={<Typography.Text className="font-medium text-gray-700">Email</Typography.Text>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="email@example.com" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<Typography.Text className="font-medium text-gray-700">Password</Typography.Text>}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password placeholder="Enter your password" size="large" />
        </Form.Item>

        <div className="mb-4 text-right">
          <AppNavLink to={ROUTES.FORGOT_PASSWORD} className="text-sm font-semibold">
            Forgot password?
          </AppNavLink>
        </div>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
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
