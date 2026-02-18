import { type FC, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCardOutlined,
  DeleteOutlined,
  FolderOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { App, Avatar, Dropdown, type DropdownProps, Flex } from 'antd';
import logoImage from '@/assets/images/logo/logo-high-resolution-with-text_small.png';
import { deleteAccount, logout as logoutApi } from '@/api/auth';
import { selectIsLoggedIn, selectLogout, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { LanguageDropdown } from '@/components/shared/LanguageDropdown';
import { AppNavLink } from '@/components/ui/AppNavLink';

import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type NavItem = {
  path: string;
  label: string;
  icon: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
};

export const Navigation: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTypedTranslation();
  const { modal, message } = App.useApp();
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const user = useProfileStore(selectUser);
  const logout = useProfileStore(selectLogout);

  const publicNavItems: NavItem[] = useMemo(
    () => [
      { path: ROUTES.HOME, label: t('nav.home'), icon: HomeOutlined },
      { path: ROUTES.PROJECTS, label: t('nav.projects'), icon: FolderOutlined },
      { path: ROUTES.CONTACT, label: t('nav.contact'), icon: MailOutlined },
      { path: ROUTES.BILLING, label: t('nav.billing'), icon: CreditCardOutlined },
    ],
    [t],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
      logout();
      navigate(ROUTES.HOME);
    } catch (error) {
      const text = error instanceof Error ? error.message : t('nav.logoutError');
      message.error(text);
    }
  }, [logout, navigate, message, t]);

  const handleDeleteAccount = useCallback(() => {
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
          logout();
          navigate(ROUTES.ACCOUNT_DELETED);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : t('deleteAccountModal.error');
          message.error(errorMessage);
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
  }, [modal, message, t, logout, navigate]);

  const userMenuItems: DropdownProps['menu'] = useMemo(
    () => ({
      items: [
        {
          key: 'profile',
          label: t('nav.editProfile'),
          icon: <SettingOutlined />,
          onClick: () => navigate(ROUTES.PROFILE),
        },
        {
          key: 'logout',
          label: t('nav.logout'),
          icon: <LogoutOutlined />,
          onClick: handleLogout,
        },
        { type: 'divider' as const },
        {
          key: 'delete-account',
          label: t('nav.deleteAccount'),
          icon: <DeleteOutlined />,
          danger: true,
          onClick: handleDeleteAccount,
        },
      ],
    }),
    [t, navigate, handleLogout, handleDeleteAccount],
  );

  const getNavLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <Flex align="center" justify="space-between">
        <Link to={ROUTES.HOME}>
          <img
            src={logoImage}
            alt={t('appName')}
            className="h-12 w-auto"
            width={120}
            height={32}
            fetchPriority="high"
          />
        </Link>
        <Flex align="center" gap={16}>
          <Flex component="ul" gap={4}>
            {publicNavItems.map((item) => (
              <li key={item.path}>
                <AppNavLink to={item.path} className={getNavLinkClassName(item.path)}>
                  <item.icon />
                  {item.label}
                </AppNavLink>
              </li>
            ))}
          </Flex>
          <div className="h-6 w-px bg-gray-200" />
          <LanguageDropdown currentLocale={i18n.language} />
          <div className="h-6 w-px bg-gray-200" />
          {isLoggedIn ? (
            <Dropdown menu={userMenuItems} trigger={['click']} placement="bottomRight">
              <button className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100">
                <Avatar
                  src={user?.avatarUrl}
                  icon={!user?.avatarUrl && <UserOutlined />}
                  size="small"
                />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </button>
            </Dropdown>
          ) : (
            <Flex component="ul" gap={4}>
              <li>
                <AppNavLink to={ROUTES.LOGIN} className={getNavLinkClassName(ROUTES.LOGIN)}>
                  <LoginOutlined />
                  {t('nav.login')}
                </AppNavLink>
              </li>
            </Flex>
          )}
        </Flex>
      </Flex>
    </nav>
  );
};
