import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { Flex } from 'antd';
import { APP_LAYOUT_CLASSNAMES } from '@/constants/layout';
import { isEmbedPathname, isHomePathname, ROUTES } from '@/constants/routes';
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

function AppLayout() {
  const location = useLocation();
  const isEmbedRoute = isEmbedPathname(location.pathname);
  const isHomeRoute = isHomePathname(location.pathname);
  const MainOrRegion = isEmbedRoute ? 'div' : 'main';

  let mainClassName: string;
  if (isEmbedRoute) {
    mainClassName = 'min-h-0 min-w-0 w-full grow overflow-hidden bg-gray-100';
  } else if (isHomeRoute) {
    mainClassName = 'grow overflow-y-auto';
  } else {
    mainClassName = `grow overflow-y-auto bg-gray-100 ${APP_LAYOUT_CLASSNAMES.padding}`;
  }

  let innerDivClassName: string;
  if (isEmbedRoute) {
    innerDivClassName = 'flex h-full min-h-0 w-full min-w-0 flex-col';
  } else if (isHomeRoute) {
    innerDivClassName = 'flex min-h-full flex-col';
  } else {
    innerDivClassName = 'flex h-full flex-col items-stretch';
  }

  return (
    <>
      <GoogleAnalytics />
      <Flex
        vertical
        className={
          isEmbedRoute
            ? 'embed-route-root h-screen min-h-0 w-full min-w-0 overflow-hidden'
            : 'h-screen min-h-0 overflow-hidden'
        }
      >
        {!isEmbedRoute && <Navigation />}
        {/* Embed: SSR already outputs document <main> + <header>; use a region div to avoid nested <main>. */}
        <MainOrRegion className={mainClassName}>
          <div className={innerDivClassName}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </MainOrRegion>
      </Flex>
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.PROJECT_EDITOR, element: <VisualizerPage /> },
      { path: ROUTES.PROJECT_NEW, element: <VisualizerPage /> },
      { path: '/projects/:projectId', element: <VisualizerPage /> },
      { path: ROUTES.EMBED_BY_TOKEN, element: <EmbedPage /> },
      { path: ROUTES.PROJECTS, element: <ProjectsPage /> },
      { path: ROUTES.CONTACT, element: <ContactPage /> },
      { path: ROUTES.ABOUT, element: <AboutPage /> },
      { path: ROUTES.FAQ, element: <FaqPage /> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.SIGN_UP, element: <SignUpPage /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
      { path: ROUTES.VERIFY_EMAIL, element: <VerifyEmailPage /> },
      { path: ROUTES.AUTH_CALLBACK, element: <AuthCallbackPage /> },
      { path: ROUTES.PROFILE, element: <AccountPage /> },
      { path: ROUTES.ACCOUNT_DELETED, element: <AccountDeletedPage /> },
      { path: ROUTES.BILLING, element: <BillingPage /> },
      { path: ROUTES.PAYMENTS_RETURN, element: <PaymentReturnPage /> },
      { path: ROUTES.PAYMENTS_CANCEL, element: <PaymentCancelPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
