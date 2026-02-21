import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { App as AntApp, ConfigProvider, Flex } from 'antd';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { ROUTES } from '@/constants/routes';
import { LocaleSync } from '@/components/shared/LocaleSync';
import { Navigation } from '@/components/shared/Navigation';
import { PageLoader } from '@/components/shared/PageLoader';
import { theme } from '@/styles/antd-theme';
import './App.css';

const HomePage = lazy(() => import('@/pages/HomePage'));
const VisualizerPage = lazy(() => import('@/pages/VisualizerPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignUpPage = lazy(() => import('@/pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const PaymentReturnPage = lazy(() => import('@/pages/PaymentReturnPage'));
const PaymentCancelPage = lazy(() => import('@/pages/PaymentCancelPage'));
const AccountDeletedPage = lazy(() => import('@/pages/AccountDeletedPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const SecurityPage = lazy(() => import('@/pages/SecurityPage'));

function AppContent() {
  return (
    <BrowserRouter>
      <Flex vertical className="h-screen overflow-hidden">
        <Navigation />
        <main
          className={`flex flex-1 items-center overflow-y-auto bg-gray-100 ${APP_LAYOUT_CLASSNAMES.padding}`}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.PROJECT_EDITOR} element={<VisualizerPage />} />
              <Route path={ROUTES.PROJECT_NEW} element={<VisualizerPage />} />
              <Route path="/projects/:projectId" element={<VisualizerPage />} />
              <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
              <Route path={ROUTES.CONTACT} element={<ContactPage />} />
              <Route path={ROUTES.ABOUT} element={<AboutPage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
              <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
              <Route path={ROUTES.PROFILE} element={<AccountPage />} />
              <Route path={ROUTES.SECURITY} element={<SecurityPage />} />
              <Route path={ROUTES.ACCOUNT_DELETED} element={<AccountDeletedPage />} />
              <Route path={ROUTES.BILLING} element={<BillingPage />} />
              <Route path={ROUTES.PAYMENTS_RETURN} element={<PaymentReturnPage />} />
              <Route path={ROUTES.PAYMENTS_CANCEL} element={<PaymentCancelPage />} />
            </Routes>
          </Suspense>
        </main>
      </Flex>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp message={{ duration: 5 }}>
        <LocaleSync />
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
