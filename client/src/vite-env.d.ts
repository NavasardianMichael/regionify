/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (e.g. G-XXXXXXXX). Omit or leave empty to disable analytics. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Sentry DSN. Omit or leave empty to disable error tracking. */
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
