import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import {
  CreditCardOutlined,
  HomeOutlined,
  LoginOutlined,
  MailOutlined,
  TableOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { App as AntApp, ConfigProvider, Flex, Spin } from 'antd';
import logoImage from '@/assets/images/logo/logo-high-resolution-with-text_small.png';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { ROUTES } from '@/constants/routes';
import { AppNavLink } from '@/components/ui/AppNavLink';
import { theme } from '@/styles/antd-theme';
import './App.css';

const HomePage = lazy(() => import('@/pages/HomePage'));
const VisualizerPage = lazy(() => import('@/pages/VisualizerPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignUpPage = lazy(() => import('@/pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const PageLoader = () => (
  <Flex align="center" justify="center" className="h-full">
    <Spin size="large" />
  </Flex>
);

type NavItem = {
  path: string;
  label: string;
  icon: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
};

const NAV_ITEMS: NavItem[] = [
  { path: ROUTES.HOME, label: 'Home', icon: HomeOutlined },
  { path: ROUTES.VISUALIZER, label: 'Visualizer', icon: TableOutlined },
  { path: ROUTES.CONTACT, label: 'Contact', icon: MailOutlined },
  { path: ROUTES.BILLING, label: 'Billing', icon: CreditCardOutlined },
];

const AUTH_NAV_ITEMS: NavItem[] = [{ path: ROUTES.LOGIN, label: 'Login', icon: LoginOutlined }];

const Navigation = () => {
  const location = useLocation();

  const renderNavItems = (items: typeof NAV_ITEMS) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      return (
        <li key={item.path}>
          <AppNavLink
            to={item.path}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-600'
                : 'hover:text-primary-600 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon />
            {item.label}
          </AppNavLink>
        </li>
      );
    });

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
            {renderNavItems(NAV_ITEMS)}
          </Flex>
          <div className="h-6 w-px bg-gray-200" />
          <Flex component="ul" gap={4}>
            {renderNavItems(AUTH_NAV_ITEMS)}
          </Flex>
        </Flex>
      </Flex>
    </nav>
  );
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <BrowserRouter>
          <Flex vertical className="h-screen overflow-hidden bg-gray-100">
            <Navigation />
            <main
              className={`flex min-h-0 flex-1 items-center overflow-y-auto ${APP_LAYOUT_CLASSNAMES.padding}`}
            >
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path={ROUTES.HOME} element={<HomePage />} />
                  <Route path={ROUTES.VISUALIZER} element={<VisualizerPage />} />
                  <Route path={ROUTES.CONTACT} element={<ContactPage />} />
                  <Route path={ROUTES.ABOUT} element={<AboutPage />} />
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
                  <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                  <Route path={ROUTES.BILLING} element={<BillingPage />} />
                </Routes>
              </Suspense>
            </main>
          </Flex>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
