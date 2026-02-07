export const ROUTES = {
  HOME: '/',
  PROJECTS: '/projects',
  PROJECT_EDITOR: '/projects/edit',
  CONTACT: '/contact',
  ABOUT: '/about',
  BILLING: '/billing',

  // Auth routes
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
