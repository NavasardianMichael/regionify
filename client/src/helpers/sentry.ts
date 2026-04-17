import * as Sentry from '@sentry/react';

const SENTRY_DSN_PATTERN = /^https:\/\/[a-f0-9]+@[a-z0-9.]+\.sentry\.io\/\d+$/i;

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  if (!SENTRY_DSN_PATTERN.test(dsn)) {
    if (import.meta.env.DEV) {
      console.warn('[sentry] VITE_SENTRY_DSN is set but does not look like a valid Sentry DSN.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
