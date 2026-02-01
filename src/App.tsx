import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { CreditCardOutlined, HomeOutlined, MailOutlined, TableOutlined } from '@ant-design/icons';
import { App as AntApp, ConfigProvider, Flex, Spin } from 'antd';
import logoImage from '@/assets/images/logo/logo-high-resolution-with-text.png';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { AppNavLink } from '@/components/ui/AppNavLink';
import { theme } from '@/styles/antd-theme';
import './App.css';

const HomePage = lazy(() => import('@/pages/HomePage'));
const VisualizerPage = lazy(() => import('@/pages/VisualizerPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));

const PageLoader = () => (
  <Flex align="center" justify="center" className="h-full">
    <Spin size="large" />
  </Flex>
);

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: HomeOutlined },
  { path: '/visualizer', label: 'Visualizer', icon: TableOutlined },
  { path: '/contact', label: 'Contact', icon: MailOutlined },
  { path: '/billing', label: 'Billing', icon: CreditCardOutlined },
];

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <Flex align="center" justify="space-between">
        <Link to="/">
          <img src={logoImage} alt="Region Map" className="h-12 w-auto" width={120} height={32} />
        </Link>
        <Flex component="ul" gap={4}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <AppNavLink
                  to={item.path}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary!'
                      : 'hover:text-primary! text-gray-600! hover:bg-gray-100'
                  }`}
                >
                  <Icon />
                  {item.label}
                </AppNavLink>
              </li>
            );
          })}
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
            <main className={`min-h-0 flex-1 ${APP_LAYOUT_CLASSNAMES.padding}`}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/visualizer" element={<VisualizerPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/about" element={<AboutPage />} />
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
