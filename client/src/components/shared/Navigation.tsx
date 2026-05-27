import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CloseOutlined,
  CreditCardOutlined,
  DownOutlined,
  FolderOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { Locale, UserPublic } from '@regionify/shared';
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
import { useIsLgUp } from '@/hooks/useIsLgUp';
import { isUntranslatablePathname, ROUTES } from '@/constants/routes';
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

type UserNavAvatarProps = {
  avatarUrl?: string | null;
  displayName: string;
};

const UserNavAvatar: FC<UserNavAvatarProps> = ({ avatarUrl, displayName }) => (
  <Avatar
    size="small"
    src={avatarUrl || undefined}
    icon={displayName ? undefined : <UserOutlined />}
    alt={displayName ? `${displayName}'s avatar` : 'User avatar'}
    className="shrink-0"
  >
    {displayName ? displayName.charAt(0).toUpperCase() : undefined}
  </Avatar>
);

function getNavLinkClassName(path: string, currentPathname: string): string {
  const isActive = currentPathname === path;
  return `flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors lg:gap-2 lg:px-4 ${
    isActive ? 'bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
  }`;
}

type DesktopNavProps = {
  publicNavItems: NavItem[];
  isLoggedIn: boolean;
  user: UserPublic | null;
  userMenuItems: DropdownProps['menu'];
  currentLocale: Locale;
  currentPathname: string;
  showLanguage: boolean;
};

const DesktopNav: FC<DesktopNavProps> = ({
  publicNavItems,
  isLoggedIn,
  user,
  userMenuItems,
  currentLocale,
  currentPathname,
  showLanguage,
}) => {
  const { t } = useTypedTranslation();
  const userDisplayName = user?.name?.trim() ?? '';

  return (
    <Flex align="center" gap={12} className="flex-1 justify-end lg:gap-4">
      <Flex component="ul" align="center" gap={4}>
        {publicNavItems.map((item) => (
          <li key={item.path}>
            <AppNavLink to={item.path} className={getNavLinkClassName(item.path, currentPathname)}>
              <item.icon />
              {item.label}
            </AppNavLink>
          </li>
        ))}
      </Flex>
      {showLanguage && (
        <>
          <div className="h-6 w-px bg-gray-200" aria-hidden />
          <LanguageDropdown currentLocale={currentLocale} placement="bottomRight" />
        </>
      )}
      <div className="h-6 w-px bg-gray-200" aria-hidden />
      {isLoggedIn ? (
        <Dropdown menu={userMenuItems} trigger={['click']} placement="bottomRight">
          <Button type="text" className="flex! max-w-55 min-w-0 items-center gap-2 px-2! py-1!">
            <UserNavAvatar avatarUrl={user?.avatarUrl} displayName={userDisplayName} />
            <Typography.Text
              ellipsis={{ tooltip: userDisplayName || undefined }}
              className="mb-0! inline-block max-w-45! truncate align-middle text-sm font-medium text-gray-700"
            >
              {user?.name}
            </Typography.Text>
            <DownOutlined className="shrink-0 text-[10px] text-gray-400" aria-hidden />
          </Button>
        </Dropdown>
      ) : (
        <Flex component="ul" gap={4}>
          <li>
            <AppNavLink
              to={ROUTES.LOGIN}
              className={getNavLinkClassName(ROUTES.LOGIN, currentPathname)}
              data-i18n-key="nav.login"
            >
              <LoginOutlined />
              {t('nav.login')}
            </AppNavLink>
          </li>
        </Flex>
      )}
    </Flex>
  );
};

type MobileDrawerContentProps = {
  publicNavItems: NavItem[];
  isLoggedIn: boolean;
  user: UserPublic | null;
  currentPathname: string;
  onNavigateProfile: () => void;
  onLogout: () => void;
};

const MobileDrawerContent: FC<MobileDrawerContentProps> = ({
  publicNavItems,
  isLoggedIn,
  user,
  currentPathname,
  onNavigateProfile,
  onLogout,
}) => {
  const { t } = useTypedTranslation();
  const userDisplayName = user?.name?.trim() ?? '';

  const drawerNavLinkClassName = (path: string) =>
    `${getNavLinkClassName(path, currentPathname)} w-full justify-start`;

  return (
    <Flex vertical gap="small" className="pb-4">
      <Flex component="ul" vertical gap={4} className="m-0 list-none p-0">
        {publicNavItems.map((item) => (
          <li key={item.path} className="w-full">
            <AppNavLink to={item.path} className={drawerNavLinkClassName(item.path)}>
              <item.icon />
              {item.label}
            </AppNavLink>
          </li>
        ))}
      </Flex>
      <Divider className="my-2!" />
      {isLoggedIn ? (
        <Flex vertical gap="small">
          <Flex align="center" gap="small" className="min-h-10 min-w-0 px-1">
            <UserNavAvatar avatarUrl={user?.avatarUrl} displayName={userDisplayName} />
            <Typography.Text
              ellipsis={{ tooltip: userDisplayName || undefined }}
              className="mb-0! inline-block max-w-50 truncate align-middle text-sm font-medium text-gray-800"
            >
              {user?.name}
            </Typography.Text>
          </Flex>
          <Button
            type="text"
            block
            icon={<SettingOutlined />}
            className="justify-start!"
            onClick={onNavigateProfile}
            data-i18n-key="nav.account"
          >
            {t('nav.account')}
          </Button>
          <Button
            type="text"
            block
            danger
            icon={<LogoutOutlined />}
            className="justify-start!"
            onClick={onLogout}
            data-i18n-key="nav.logout"
          >
            {t('nav.logout')}
          </Button>
        </Flex>
      ) : (
        <AppNavLink
          to={ROUTES.LOGIN}
          className={`${drawerNavLinkClassName(ROUTES.LOGIN)}`}
          data-i18n-key="nav.login"
        >
          <LoginOutlined />
          {t('nav.login')}
        </AppNavLink>
      )}
    </Flex>
  );
};

export const Navigation: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTypedTranslation();
  const { message } = useAppFeedback();
  const isLgUp = useIsLgUp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const user = useProfileStore(selectUser);
  const logout = useProfileStore(selectLogout);

  const publicNavItems: NavItem[] = useMemo(
    () => [
      { path: ROUTES.HOME, label: t('nav.home'), icon: HomeOutlined },
      { path: ROUTES.PROJECTS, label: t('nav.projects'), icon: FolderOutlined },
      { path: ROUTES.CONTACT, label: t('nav.contact'), icon: MailOutlined },
      { path: ROUTES.ABOUT, label: t('nav.about'), icon: InfoCircleOutlined },
      { path: ROUTES.FAQ, label: t('nav.faq'), icon: QuestionCircleOutlined },
      { path: ROUTES.BILLING, label: t('nav.pricing'), icon: CreditCardOutlined },
    ],
    [t],
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
    });
  }, [location.pathname, isLgUp]);

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

  const handleNavigateProfile = useCallback(() => {
    navigate(ROUTES.PROFILE);
  }, [navigate]);

  const handleLogoutClick = useCallback(() => {
    void handleLogout();
  }, [handleLogout]);

  const userMenuItems: DropdownProps['menu'] = useMemo(
    () => ({
      items: [
        {
          key: 'account',
          label: t('nav.account'),
          icon: <SettingOutlined />,
          onClick: handleNavigateProfile,
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
    [t, handleNavigateProfile, handleLogout],
  );

  const mobileDrawerTitle = useMemo(
    () => (
      <Flex align="center" justify="space-between" gap={8} className="w-full min-w-0">
        <Typography.Text
          strong
          className="mb-0! min-w-0 flex-1 truncate text-base leading-snug text-gray-900"
          data-i18n-key="nav.mainMenu"
        >
          {t('nav.mainMenu')}
        </Typography.Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          aria-label={t('nav.closeMenu')}
          onClick={closeMobileMenu}
          className="shrink-0 text-gray-500!"
          data-i18n-key="nav.closeMenu"
        />
      </Flex>
    ),
    [closeMobileMenu, t],
  );

  return (
    <>
      <nav className="shrink-0 border-b border-gray-200 bg-white px-3 py-3 md:px-6">
        <Flex align="center" justify="space-between" gap={8} className="min-w-0">
          <Link
            to={ROUTES.HOME}
            className="flex shrink-0 items-center outline-offset-2 [&_img]:max-h-10 [&_img]:w-auto [&_img]:max-w-[min(160px,42vw)] [&_img]:object-contain [&_img]:object-left md:[&_img]:max-h-11 lg:[&_img]:max-h-12 lg:[&_img]:max-w-none"
          >
            <img src={logoImage} alt={t('appName')} fetchPriority="high" data-i18n-key="appName" />
          </Link>
          {isLgUp ? (
            <DesktopNav
              publicNavItems={publicNavItems}
              isLoggedIn={isLoggedIn}
              user={user}
              userMenuItems={userMenuItems}
              currentLocale={i18n.language as Locale}
              currentPathname={location.pathname}
              showLanguage={!isUntranslatablePathname(location.pathname)}
            />
          ) : (
            <Flex align="center" gap={8}>
              {!isUntranslatablePathname(location.pathname) && (
                <LanguageDropdown currentLocale={i18n.language as Locale} placement="bottomRight" />
              )}
              <Button
                type="text"
                icon={<MenuOutlined />}
                aria-label={t('nav.openMenu')}
                aria-expanded={mobileMenuOpen}
                aria-haspopup="dialog"
                onClick={() => setMobileMenuOpen(true)}
                data-i18n-key="nav.openMenu"
              />
            </Flex>
          )}
        </Flex>
      </nav>

      <Drawer
        title={mobileDrawerTitle}
        closable={false}
        placement="right"
        size={280}
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        destroyOnHidden={false}
        styles={{ body: { paddingTop: 8 } }}
      >
        <MobileDrawerContent
          publicNavItems={publicNavItems}
          isLoggedIn={isLoggedIn}
          user={user}
          currentPathname={location.pathname}
          onNavigateProfile={handleNavigateProfile}
          onLogout={handleLogoutClick}
        />
      </Drawer>
    </>
  );
};
