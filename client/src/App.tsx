import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { App as AntApp, ConfigProvider, Flex } from 'antd';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/components/shared/Navigation';
import { PageLoader } from '@/components/shared/PageLoader';
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
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));

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
                  <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
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
