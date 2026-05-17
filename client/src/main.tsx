import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installNgrokDevFetchShim } from '@/helpers/ngrokDevFetchShim';
import { initSentry } from '@/helpers/sentry';
import App from './App.tsx';
import './index.css';

import '@/i18n';

if (import.meta.env.DEV) installNgrokDevFetchShim();
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
