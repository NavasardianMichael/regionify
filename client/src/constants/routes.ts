export const ROUTES = {
  HOME: '/',
  PROJECTS: '/projects',
  PROJECT_EDITOR: '/projects/edit',
  PROJECT_NEW: '/projects/new',
  PROJECT_BY_ID: '/projects/:projectId',
  CONTACT: '/contact',
  ABOUT: '/about',
  BILLING: '/billing',

  // Auth routes
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  AUTH_CALLBACK: '/auth/callback',
  ACCOUNT_DELETED: '/account-deleted',

  // Payment return/cancel (PayPal redirect)
  PAYMENTS_RETURN: '/payments/return',
  PAYMENTS_CANCEL: '/payments/cancel',
} as const;

/**
 * Helper to generate project route with ID
 */
export function getProjectRoute(projectId: string): string {
  return `/projects/${projectId}`;
}

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
