import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// Astro evaluates this file before `.env` is on `process.env`; load via Vite (see Astro env docs).
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const fileEnv = loadEnv(mode, process.cwd(), '');
const site = process.env.CLIENT_URL ?? fileEnv.CLIENT_URL;
if (typeof site !== 'string' || site.length === 0) {
  throw new Error('CLIENT_URL must be set for the marketing site.');
}

export default defineConfig({
  site,
  integrations: [react(), sitemap()],
  vite: {
    envPrefix: ['PUBLIC_', 'CLIENT_'],
    plugins: [tailwindcss()],
  },
  outDir: './dist',
});
