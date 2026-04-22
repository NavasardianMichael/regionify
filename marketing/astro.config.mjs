import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://regionify.com',
  base: '/maps',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  outDir: './dist',
});
