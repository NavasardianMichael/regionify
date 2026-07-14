import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

// Nginx still serves client/dist/client/index.html as a static file for behind-auth/
// transactional routes that aren't proxied to Node — /login, /billing, /projects*,
// /auth/*, /payments/*, /contact (see deployment/regionify.pro.conf and
// docs/SEO_INDEXING_ARCHITECTURE.md for why) — so the verification tag must still be
// baked in here for those. `/`, `/about`, `/faq`, `/terms`, `/privacy`, `/refund` are
// proxied to the Express SSR shell instead, which injects the same tag at request time.
function googleSiteVerificationPlugin(): Plugin {
  return {
    name: 'inject-google-site-verification',
    transformIndexHtml(html) {
      const token = process.env.VITE_GOOGLE_SITE_VERIFICATION;
      if (!token) return html;
      return html.replace(
        '</head>',
        `    <meta name="google-site-verification" content="${token}" />\n  </head>`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    googleSiteVerificationPlugin(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 7002,
    open: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist/client',
    manifest: true,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        embedShell: path.resolve(__dirname, 'src/embed/embed-shell.css'),
      },
    },
  },
});
