/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (e.g. G-XXXXXXXX). Omit or leave empty to disable analytics. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Sentry DSN. Omit or leave empty to disable error tracking. */
  readonly VITE_SENTRY_DSN?: string;
  /** Paddle client-side token (browser-safe). From Paddle dashboard → Developer tools → Authentication → Client-side tokens. */
  readonly VITE_PADDLE_CLIENT_TOKEN?: string;
  /** Paddle environment: "sandbox" for test, omit/"production" for live. */
  readonly VITE_PADDLE_ENV?: 'sandbox' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
