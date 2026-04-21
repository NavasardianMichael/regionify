/** True for public map embed URLs (`/embed/:token`), which should not load app analytics. */
export function isEmbedPathname(pathname: string): boolean {
  return /^\/embed\/[^/]+$/.test(pathname);
}

/** True for the marketing home page (`/`), which uses a full-bleed layout without app padding. */
export function isHomePathname(pathname: string): boolean {
  return pathname === '/';
}

/** True for pages that use full-bleed section layout (no app padding, no gray background). */
export function isFullBleedPathname(pathname: string): boolean {
  return pathname === '/' || pathname === '/about';
}

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
  FAQ: '/faq',
  BILLING: '/billing',

  // Auth routes
  PROFILE: '/profile',
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  AUTH_CALLBACK: '/auth/callback',
  ACCOUNT_DELETED: '/account-deleted',

  // Payment return/cancel (Paddle redirect)
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
