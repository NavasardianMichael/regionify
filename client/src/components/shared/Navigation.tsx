import { type FC, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCardOutlined,
  FolderOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  SafetyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { Locale } from '@regionify/shared';
import { Avatar, Dropdown, type DropdownProps, Flex } from 'antd';
import logoImage from '@/assets/images/logo/logo-high-resolution-with-text_small.png';
import { logout as logoutApi } from '@/api/auth';
import { selectIsLoggedIn, selectLogout, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { LanguageDropdown } from '@/components/shared/LanguageDropdown';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { AppNavLink } from '@/components/ui/AppNavLink';

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
  const { message } = useAppFeedback();
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
      message.error(text, 0);
    }
  }, [logout, navigate, message, t]);

  const userMenuItems: DropdownProps['menu'] = useMemo(
    () => ({
      items: [
        {
          key: 'account',
          label: t('nav.account'),
          icon: <SettingOutlined />,
          onClick: () => navigate(ROUTES.PROFILE),
        },
        {
          key: 'security',
          label: t('nav.security'),
          icon: <SafetyOutlined />,
          onClick: () => navigate(ROUTES.SECURITY),
        },
        { type: 'divider' as const },
        {
          key: 'logout',
          label: t('nav.logout'),
          icon: <LogoutOutlined />,
          onClick: handleLogout,
        },
      ],
    }),
    [t, navigate, handleLogout],
  );

  const getNavLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <nav className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
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
          <LanguageDropdown
            variant="borderless"
            currentLocale={i18n.language as Locale}
            placement="bottomRight"
          />
          <div className="h-6 w-px bg-gray-200" />
          {isLoggedIn ? (
            <Dropdown menu={userMenuItems} trigger={['click']} placement="bottomRight">
              <button className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100">
                {user?.avatarUrl ? (
                  <Avatar
                    src={user.avatarUrl}
                    size="small"
                    alt={user.name ? `${user.name}'s avatar` : 'User avatar'}
                  />
                ) : null}
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
