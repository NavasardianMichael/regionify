import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Flex } from 'antd';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { isEmbedPathname, ROUTES } from '@/constants/routes';
import { GoogleAnalytics } from '@/components/shared/GoogleAnalytics';
import { Navigation } from '@/components/shared/Navigation';
import { PageLoader } from '@/components/shared/PageLoader';

const HomePage = lazy(() => import('@/pages/HomePage'));
const VisualizerPage = lazy(() => import('@/pages/VisualizerPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
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
const EmbedPage = lazy(() => import('@/pages/EmbedPage'));

function AppRoutesLayout() {
  const location = useLocation();
  const isEmbedRoute = isEmbedPathname(location.pathname);
  const MainOrRegion = isEmbedRoute ? 'div' : 'main';

  return (
    <Flex
      vertical
      className={
        isEmbedRoute ? 'h-full min-h-0 overflow-hidden' : 'h-screen min-h-0 overflow-hidden'
      }
    >
      {!isEmbedRoute && <Navigation />}
      {/* Embed: SSR already outputs document <main> + <header>; use a region div to avoid nested <main>. */}
      <MainOrRegion
        className={
          isEmbedRoute
            ? 'min-h-0 grow overflow-hidden bg-gray-100'
            : `grow overflow-y-auto bg-gray-100 ${APP_LAYOUT_CLASSNAMES.padding}`
        }
      >
        <div
          className={
            isEmbedRoute ? 'flex h-full min-h-0 flex-col' : 'flex h-full flex-col items-stretch'
          }
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.PROJECT_EDITOR} element={<VisualizerPage />} />
              <Route path={ROUTES.PROJECT_NEW} element={<VisualizerPage />} />
              <Route path="/projects/:projectId" element={<VisualizerPage />} />
              <Route path={ROUTES.EMBED_BY_TOKEN} element={<EmbedPage />} />
              <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
              <Route path={ROUTES.CONTACT} element={<ContactPage />} />
              <Route path={ROUTES.ABOUT} element={<AboutPage />} />
              <Route path={ROUTES.FAQ} element={<FaqPage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
              <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
              <Route path={ROUTES.PROFILE} element={<AccountPage />} />
              <Route path={ROUTES.ACCOUNT_DELETED} element={<AccountDeletedPage />} />
              <Route path={ROUTES.BILLING} element={<BillingPage />} />
              <Route path={ROUTES.PAYMENTS_RETURN} element={<PaymentReturnPage />} />
              <Route path={ROUTES.PAYMENTS_CANCEL} element={<PaymentCancelPage />} />
            </Routes>
          </Suspense>
        </div>
      </MainOrRegion>
    </Flex>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <GoogleAnalytics />
      <AppRoutesLayout />
    </BrowserRouter>
  );
}
