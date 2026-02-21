import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import { AUTH_VALIDATION } from '@regionify/shared';
import { App, Button, Card as AntCard, Divider, Form, Input, Typography } from 'antd';
import { changePassword } from '@/api/auth';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';
import { Card } from '@/components/ui/Card';

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const SecurityPage: FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);

  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn === false) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
  }, [isLoggedIn, navigate]);

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(t('security.passwordUpdated'), 5);
      passwordForm.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('security.updateError');
      message.error(errorMessage, 0);
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
          {t('security.title')}
        </Typography.Title>
        <Typography.Text className="text-gray-500">{t('security.subtitle')}</Typography.Text>
      </header>

      {canChangePassword ? (
        <>
          <Typography.Title level={5} className="text-primary mb-1! text-sm font-semibold">
            {t('security.changePassword')}
          </Typography.Title>
          <Typography.Text className="mb-5 block text-sm text-gray-500">
            {t('security.changePasswordDescription')}
          </Typography.Text>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="currentPassword"
              label={<span className="text-gray-700">{t('security.currentPassword')}</span>}
              rules={[{ required: true, message: AUTH_VALIDATION.password.messages.required }]}
            >
              <Input.Password
                placeholder={t('security.currentPassword')}
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={<span className="text-gray-700">{t('security.newPassword')}</span>}
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
              <Input.Password
                placeholder={t('security.newPassword')}
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span className="text-gray-700">{t('security.confirmPassword')}</span>}
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
                placeholder={t('security.confirmPassword')}
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
                {t('security.changePassword')}
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <AntCard className="mb-6 border-gray-200">
          <Typography.Text className="text-gray-600">
            {t('security.googleAccountNote')}
          </Typography.Text>
        </AntCard>
      )}

      <Divider className="my-8 border-gray-200" />

      <div>
        <Typography.Title level={5} className="text-primary mb-4! text-sm font-semibold">
          {t('security.securityInfo.title')}
        </Typography.Title>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="mt-0.5 text-green-500" />
            <Typography.Text className="text-sm text-gray-700">
              {t('security.securityInfo.passwordHashing')}
            </Typography.Text>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="mt-0.5 text-green-500" />
            <Typography.Text className="text-sm text-gray-700">
              {t('security.securityInfo.sessionSecurity')}
            </Typography.Text>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="mt-0.5 text-green-500" />
            <Typography.Text className="text-sm text-gray-700">
              {t('security.securityInfo.rateLimiting')}
            </Typography.Text>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="mt-0.5 text-green-500" />
            <Typography.Text className="text-sm text-gray-700">
              {t('security.securityInfo.dataEncryption')}
            </Typography.Text>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6 text-center">
        <AppNavLink to={ROUTES.PROJECTS}>{t('security.backToProjects')}</AppNavLink>
      </div>
    </Card>
  );
};

export default SecurityPage;
