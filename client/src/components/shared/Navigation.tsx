import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CloseOutlined,
  CreditCardOutlined,
  FolderOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  SafetyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { Locale } from '@regionify/shared';
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  Dropdown,
  type DropdownProps,
  Flex,
  Typography,
} from 'antd';
import logoImage from '@/assets/images/logo/logo-high-resolution-with-text_small.png';
import { logout as logoutApi } from '@/api/auth';
import { selectIsLoggedIn, selectLogout, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useIsMdUp } from '@/hooks/useIsMdUp';
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
  const isMdUp = useIsMdUp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const user = useProfileStore(selectUser);
  const logout = useProfileStore(selectLogout);

  const publicNavItems: NavItem[] = useMemo(
    () => [
      { path: ROUTES.HOME, label: t('nav.home'), icon: HomeOutlined },
      { path: ROUTES.PROJECTS, label: t('nav.projects'), icon: FolderOutlined },
      { path: ROUTES.CONTACT, label: t('nav.contact'), icon: MailOutlined },
      { path: ROUTES.BILLING, label: t('nav.plans'), icon: CreditCardOutlined },
    ],
    [t],
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
    });
  }, [location.pathname, isMdUp]);

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

  const getDrawerNavLinkClassName = (path: string) =>
    `${getNavLinkClassName(path)} w-full justify-start`;

  const mobileDrawerTitle = useMemo(
    () => (
      <Flex align="center" justify="space-between" gap={8} className="w-full min-w-0">
        <Typography.Text
          strong
          className="mb-0! min-w-0 flex-1 truncate text-base leading-snug text-gray-900"
        >
          {t('nav.mainMenu')}
        </Typography.Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          aria-label={t('nav.closeMenu')}
          onClick={closeMobileMenu}
          className="shrink-0 text-gray-500!"
        />
      </Flex>
    ),
    [closeMobileMenu, t],
  );

  const desktopTrailing = (
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
      <div className="h-6 w-px bg-gray-200" aria-hidden />
      <LanguageDropdown
        variant="borderless"
        currentLocale={i18n.language as Locale}
        placement="bottomRight"
      />
      <div className="h-6 w-px bg-gray-200" aria-hidden />
      {isLoggedIn ? (
        <Dropdown menu={userMenuItems} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100"
          >
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
  );

  const drawerContent = (
    <Flex vertical gap="small" className="pb-4">
      <Flex component="ul" vertical gap={4} className="m-0 list-none p-0">
        {publicNavItems.map((item) => (
          <li key={item.path} className="w-full">
            <AppNavLink to={item.path} className={getDrawerNavLinkClassName(item.path)}>
              <item.icon />
              {item.label}
            </AppNavLink>
          </li>
        ))}
      </Flex>
      <Divider className="my-2!" />
      {isLoggedIn ? (
        <Flex vertical gap="small">
          <Flex align="center" gap="small" className="min-h-10 px-1">
            {user?.avatarUrl ? (
              <Avatar
                src={user.avatarUrl}
                size="small"
                alt={user.name ? `${user.name}'s avatar` : 'User avatar'}
              />
            ) : null}
            <span className="text-sm font-medium text-gray-800">{user?.name}</span>
          </Flex>
          <Button
            type="text"
            block
            icon={<SettingOutlined />}
            className="justify-start!"
            onClick={() => {
              navigate(ROUTES.PROFILE);
            }}
          >
            {t('nav.account')}
          </Button>
          <Button
            type="text"
            block
            icon={<SafetyOutlined />}
            className="justify-start!"
            onClick={() => {
              navigate(ROUTES.SECURITY);
            }}
          >
            {t('nav.security')}
          </Button>
          <Button
            type="text"
            block
            danger
            icon={<LogoutOutlined />}
            className="justify-start!"
            onClick={() => void handleLogout()}
          >
            {t('nav.logout')}
          </Button>
        </Flex>
      ) : (
        <AppNavLink to={ROUTES.LOGIN} className={getDrawerNavLinkClassName(ROUTES.LOGIN)}>
          <LoginOutlined />
          {t('nav.login')}
        </AppNavLink>
      )}
    </Flex>
  );

  return (
    <>
      <nav className="shrink-0 border-b border-gray-200 bg-white px-3 py-3 md:px-6">
        <Flex align="center" justify="space-between">
          <Link to={ROUTES.HOME}>
            <img
              src={logoImage}
              alt={t('appName')}
              className="h-10 w-auto md:h-12"
              width={120}
              height={32}
              fetchPriority="high"
            />
          </Link>
          {isMdUp ? (
            desktopTrailing
          ) : (
            <Flex align="center" gap={8}>
              <LanguageDropdown
                variant="borderless"
                currentLocale={i18n.language as Locale}
                placement="bottomRight"
              />
              <Button
                type="text"
                icon={<MenuOutlined />}
                aria-label={t('nav.openMenu')}
                aria-expanded={mobileMenuOpen}
                aria-haspopup="dialog"
                onClick={() => setMobileMenuOpen(true)}
              />
            </Flex>
          )}
        </Flex>
      </nav>

      <Drawer
        title={mobileDrawerTitle}
        closable={false}
        placement="right"
        width={280}
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        destroyOnClose={false}
        styles={{ body: { paddingTop: 8 } }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};
