import { type FC } from 'react';
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
import { AppNavLink } from '@/components/ui/AppNavLink';

type NavItem = {
  path: string;
  label: string;
  icon: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
};

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { path: ROUTES.HOME, label: 'Home', icon: HomeOutlined },
  { path: ROUTES.PROJECTS, label: 'Projects', icon: FolderOutlined },
  { path: ROUTES.CONTACT, label: 'Contact', icon: MailOutlined },
  { path: ROUTES.BILLING, label: 'Billing', icon: CreditCardOutlined },
];

const AUTH_NAV_ITEMS: NavItem[] = [];

export const Navigation: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const user = useProfileStore(selectUser);
  const logout = useProfileStore(selectLogout);

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      navigate(ROUTES.HOME);
    } catch {
      // Ignore error
    }
  };

  const handleDeleteAccount = () => {
    const modalInstance = modal.confirm({
      title: 'Delete Account',
      icon: null,
      content:
        'Are you sure you want to delete your account? All your data, including projects, will be permanently removed. This action cannot be undone.',
      okText: 'Delete Account',
      okButtonProps: { type: 'primary', danger: true },
      cancelText: 'Cancel',
      closable: true,
      maskClosable: false,
      onOk: async () => {
        // Disable buttons and prevent closing during request
        modalInstance.update({
          okButtonProps: { disabled: true, loading: true },
          cancelButtonProps: { disabled: true },
          closable: false,
          maskClosable: false,
        });

        try {
          await deleteAccount();
          // Verify success before proceeding - destroy modal and navigate
          modalInstance.destroy();
          logout();
          navigate(ROUTES.ACCOUNT_DELETED);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
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
  };

  const userMenuItems: DropdownProps['menu'] = {
    items: [
      {
        key: 'profile',
        label: 'Edit profile',
        icon: <SettingOutlined />,
        onClick: () => navigate(ROUTES.PROFILE),
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
      { type: 'divider' as const },
      {
        key: 'delete-account',
        label: 'Delete Account',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: handleDeleteAccount,
      },
    ],
  };

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
            alt="Region Map"
            className="h-12 w-auto"
            width={120}
            height={32}
            fetchPriority="high"
          />
        </Link>
        <Flex align="center" gap={16}>
          <Flex component="ul" gap={4}>
            {PUBLIC_NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <AppNavLink to={item.path} className={getNavLinkClassName(item.path)}>
                  <item.icon />
                  {item.label}
                </AppNavLink>
              </li>
            ))}
            {isLoggedIn &&
              AUTH_NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <AppNavLink to={item.path} className={getNavLinkClassName(item.path)}>
                    <item.icon />
                    {item.label}
                  </AppNavLink>
                </li>
              ))}
          </Flex>
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
                  Login
                </AppNavLink>
              </li>
            </Flex>
          )}
        </Flex>
      </Flex>
    </nav>
  );
};
