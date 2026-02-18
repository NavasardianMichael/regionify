import { type FC, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AUTH_VALIDATION } from '@regionify/shared';
import { App, Button, Divider, Form, Input, Typography } from 'antd';
import { changePassword, updateProfile } from '@/api/auth';
import { selectIsLoggedIn, selectSetUser, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { Card } from '@/components/ui/Card';

type ProfileFormValues = {
  name: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EditProfilePage: FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const setUser = useProfileStore(selectSetUser);

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn === false) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
    if (user) {
      profileForm.setFieldsValue({ name: user.name });
    }
  }, [isLoggedIn, user, navigate, profileForm]);

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    setProfileLoading(true);
    try {
      const { user: updatedUser } = await updateProfile({ name: values.name });
      setUser(updatedUser);
      message.success('Profile updated successfully.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      message.error(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password updated successfully.');
      passwordForm.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isLoggedIn || !user) {
    return null;
  }

  const canChangePassword = user.provider === 'local';

  return (
    <Card className="mx-auto! w-full max-w-144! bg-white! px-6! py-8! shadow-sm! md:px-10! md:py-10!">
      <header className="mb-8 text-center">
        <Typography.Title level={1} className="text-primary mb-1! text-2xl font-semibold">
          Edit profile
        </Typography.Title>
        <Typography.Text className="text-gray-500">Update your name and password.</Typography.Text>
      </header>

      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleProfileSubmit}
        requiredMark={false}
        className="mb-0"
      >
        <Form.Item
          name="name"
          label={<span className="text-gray-700">Name</span>}
          rules={[
            { required: true, message: AUTH_VALIDATION.name.messages.required },
            {
              min: AUTH_VALIDATION.name.minLength,
              message: AUTH_VALIDATION.name.messages.minLength,
            },
            {
              max: AUTH_VALIDATION.name.maxLength,
              message: AUTH_VALIDATION.name.messages.maxLength,
            },
            {
              pattern: AUTH_VALIDATION.name.pattern,
              message: AUTH_VALIDATION.name.messages.pattern,
            },
          ]}
        >
          <Input placeholder="Your name" size="large" className="rounded-lg" />
        </Form.Item>

        <Form.Item label={<span className="text-gray-700">Email</span>}>
          <Input
            value={user.email}
            disabled
            size="large"
            className="rounded-lg bg-gray-50 text-gray-600"
          />
        </Form.Item>
        <Typography.Text className="mb-6 block text-xs text-gray-400">
          Email cannot be changed for security reasons.
        </Typography.Text>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={profileLoading}
            className="w-full rounded-lg font-medium"
          >
            Save profile
          </Button>
        </Form.Item>
      </Form>

      {canChangePassword && (
        <>
          <Divider className="my-8 border-gray-200" />
          <Typography.Title level={5} className="text-primary mb-1! text-sm font-semibold">
            Change password
          </Typography.Title>
          <Typography.Text className="mb-5 block text-sm text-gray-500">
            Enter your current password and choose a new one.
          </Typography.Text>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="currentPassword"
              label={<span className="text-gray-700">Current password</span>}
              rules={[{ required: true, message: AUTH_VALIDATION.password.messages.required }]}
            >
              <Input.Password placeholder="Current password" size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={<span className="text-gray-700">New password</span>}
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
              <Input.Password placeholder="New password" size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span className="text-gray-700">Confirm new password</span>}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: AUTH_VALIDATION.confirmPassword.messages.required },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
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
                placeholder="Confirm new password"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={passwordLoading}
                className="w-full rounded-lg font-medium"
              >
                Change password
              </Button>
            </Form.Item>
          </Form>
        </>
      )}

      <div className="mt-8 border-t border-gray-100 pt-6 text-center">
        <Link
          to={ROUTES.PROJECTS}
          className="hover:text-primary text-sm text-gray-500 transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>
    </Card>
  );
};

export default EditProfilePage;
