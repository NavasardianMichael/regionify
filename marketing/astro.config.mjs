import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import { lastModifiedForPath } from './src/data/lastModified.ts';

const BASE = '/marketing';

// Astro evaluates this file before `.env` is on `process.env`; load via Vite (see Astro env docs).
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const fileEnv = loadEnv(mode, process.cwd(), '');
const site = process.env.CLIENT_URL ?? fileEnv.CLIENT_URL;
if (typeof site !== 'string' || site.length === 0) {
  throw new Error('CLIENT_URL must be set for the marketing site.');
}

export default defineConfig({
  site,
  base: BASE,
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        const { pathname } = new URL(item.url);
        if (!pathname.startsWith(BASE)) return item;

        const lastmod = lastModifiedForPath(pathname.slice(BASE.length));
        return lastmod === undefined ? item : { ...item, lastmod };
      },
    }),
  ],
  vite: {
    envPrefix: ['PUBLIC_', 'CLIENT_'],
    plugins: [tailwindcss()],
  },
  server: {
    open: true,
  },
  outDir: './dist',
});
