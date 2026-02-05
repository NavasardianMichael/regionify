import { type FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { register } from '@/api/auth';
import { ROUTES } from '@/constants/routes';

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUpPage: FC = () => {
  const [form] = Form.useForm<SignUpFormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const handleSubmit = async (values: SignUpFormValues) => {
    setLoading(true);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      message.success('Account created successfully!');
      navigate(ROUTES.HOME);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto! w-full max-w-144! shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={1} className="text-primary mb-0! text-2xl font-bold">
          Create Account
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Sign up to get started with Regionify
        </Typography.Paragraph>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="name"
          label={<Typography.Text className="font-medium text-gray-700">Full Name</Typography.Text>}
          rules={[
            { required: true, message: 'Please enter your name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            {
              pattern: /^[a-zA-Z\s'-]+$/,
              message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
            },
          ]}
        >
          <Input placeholder="John Doe" size="large" />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 8, message: 'Password must be at least 8 characters' },
            {
              pattern: /[a-z]/,
              message: 'Password must contain at least one lowercase letter',
            },
            {
              pattern: /[A-Z]/,
              message: 'Password must contain at least one uppercase letter',
            },
            {
              pattern: /[0-9]/,
              message: 'Password must contain at least one number',
            },
          ]}
        >
          <Input.Password placeholder="Create a password" size="large" />
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
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm your password" size="large" />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Create Account
          </Button>
        </Form.Item>

        <div className="text-center text-gray-600">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </Form>
    </Card>
  );
};

export default SignUpPage;
