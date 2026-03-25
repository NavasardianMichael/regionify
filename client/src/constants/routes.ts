export const ROUTES = {
  HOME: '/',
  PROJECTS: '/projects',
  PROJECT_EDITOR: '/projects/edit',
  PROJECT_NEW: '/projects/new',
  PROJECT_BY_ID: '/projects/:projectId',
  /** Public map embed (standalone URL or iframe). */
  EMBED_BY_TOKEN: '/embed/:token',
  CONTACT: '/contact',
  ABOUT: '/about',
  BILLING: '/billing',

  // Auth routes
  PROFILE: '/profile',
  SECURITY: '/security',
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  AUTH_CALLBACK: '/auth/callback',
  ACCOUNT_DELETED: '/account-deleted',

  // Payment return/cancel (Lemon Squeezy redirect)
  PAYMENTS_RETURN: '/payments/return',
  PAYMENTS_CANCEL: '/payments/cancel',
} as const;

/**
 * Helper to generate project route with ID
 */
export function getProjectRoute(projectId: string): string {
  return `/projects/${projectId}`;
}

export function getEmbedRoute(embedToken: string): string {
  return `/embed/${encodeURIComponent(embedToken)}`;
}

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
