import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_VALIDATION, type Plan, PLANS } from '@regionify/shared';
import { Badge, Button, Divider, Flex, Form, Input, Typography } from 'antd';
import { deleteAccount, updateProfile } from '@/api/auth';
import { selectIsLoggedIn, selectSetUser, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { planRibbonColor, planRibbonNameKey } from '@/helpers/planRibbonColor';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { Card } from '@/components/ui/Card';

type ProfileFormValues = {
  name: string;
};

const AccountPage: FC = () => {
  const navigate = useNavigate();
  const { message, modal } = useAppFeedback();
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const setUser = useProfileStore(selectSetUser);
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [profileLoading, setProfileLoading] = useState(false);
  const watchedName = Form.useWatch('name', profileForm);

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
      message.success(t('account.profileUpdated'), 5);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('account.updateError');
      message.error(errorMessage, 0);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    const modalInstance = modal.confirm({
      title: t('deleteAccountModal.title'),
      icon: null,
      content: t('deleteAccountModal.content'),
      okText: t('deleteAccountModal.ok'),
      okButtonProps: { type: 'primary', danger: true },
      cancelText: t('nav.cancel'),
      closable: true,
      maskClosable: false,
      onOk: async () => {
        modalInstance.update({
          okButtonProps: { disabled: true, loading: true },
          cancelButtonProps: { disabled: true },
          closable: false,
          maskClosable: false,
        });

        try {
          await deleteAccount();
          modalInstance.destroy();
          const { name, email } = user!;
          navigate(ROUTES.ACCOUNT_DELETED, { state: { name, email } });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : t('deleteAccountModal.error');
          message.error(errorMessage, 0);
          // Re-enable buttons on error
          modalInstance.update({
            okButtonProps: { disabled: false, loading: false, type: 'primary', danger: true },
            cancelButtonProps: { disabled: false },
            closable: true,
            maskClosable: false,
          });
        }
      },
    });
  };

  if (!isLoggedIn || !user) {
    return null;
  }

  const isProfileDirty = (watchedName ?? '').trim() !== user.name.trim();

  const accountPlan: Plan = user.plan ?? PLANS.observer;

  return (
    <Badge.Ribbon
      text={t(planRibbonNameKey(accountPlan))}
      color={planRibbonColor(accountPlan)}
      placement="end"
      rootClassName="mx-auto w-full max-w-144 overflow-visible"
      className="top-3! font-medium"
      data-i18n-key="plans.items.observer.name"
    >
      <Card className="w-full overflow-visible bg-white! shadow-sm!">
        <header className="mb-8 text-center">
          <Typography.Title
            level={1}
            className="text-primary mb-1! text-2xl font-semibold"
            data-i18n-key="account.title"
          >
            {t('account.title')}
          </Typography.Title>
          <Typography.Text className="text-gray-500" data-i18n-key="account.subtitle">
            {t('account.subtitle')}
          </Typography.Text>
        </header>

        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileSubmit}
          requiredMark={false}
          className="mb-0"
        >
          <Flex vertical gap="middle" className="w-full">
            <Form.Item
              name="name"
              className="mb-0!"
              label={
                <Typography.Text className="font-medium text-gray-700" data-i18n-key="account.name">
                  {t('account.name')}
                </Typography.Text>
              }
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
              <Input
                placeholder={t('account.name')}
                className="rounded-lg"
                data-i18n-key="account.name"
              />
            </Form.Item>

            <Flex vertical gap="small" className="w-full">
              <Form.Item
                className="mb-0!"
                label={
                  <Typography.Text
                    className="font-medium text-gray-700"
                    data-i18n-key="account.email"
                  >
                    {t('account.email')}
                  </Typography.Text>
                }
              >
                <Input
                  value={user.email}
                  disabled
                  className="rounded-lg bg-gray-50 text-gray-600"
                />
              </Form.Item>
              <Typography.Text
                className="block text-[12px]! text-gray-400"
                data-i18n-key="account.emailNote"
              >
                {t('account.emailNote')}
              </Typography.Text>
            </Flex>

            <Form.Item className="mb-0!">
              <Button
                type="primary"
                htmlType="submit"
                loading={profileLoading}
                disabled={!isProfileDirty}
                className="w-full rounded-lg font-medium"
                data-i18n-key="account.saveProfile"
              >
                {t('account.saveProfile')}
              </Button>
            </Form.Item>
          </Flex>
        </Form>

        <Divider className="my-8 border-gray-200" />

        <Flex vertical gap="middle" className="w-full">
          <Flex vertical gap="small" className="w-full">
            <Typography.Title
              level={5}
              className="text-primary mb-0! text-sm font-semibold"
              data-i18n-key="nav.deleteAccount"
            >
              {t('nav.deleteAccount')}
            </Typography.Title>
            <Typography.Text
              className="block text-sm text-gray-500"
              data-i18n-key="deleteAccountModal.content"
            >
              {t('deleteAccountModal.content')}
            </Typography.Text>
          </Flex>
          <Button
            type="primary"
            danger
            onClick={handleDeleteAccount}
            className="w-full rounded-lg font-medium"
            data-i18n-key="nav.deleteAccount"
          >
            {t('nav.deleteAccount')}
          </Button>
        </Flex>
      </Card>
    </Badge.Ribbon>
  );
};

export default AccountPage;
