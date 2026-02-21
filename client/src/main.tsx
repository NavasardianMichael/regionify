import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { message } from 'antd';
import App from './App.tsx';
import './index.css';

import '@/i18n';

// Success/info auto-hide after 5s; error/warning use duration 0 at call site
message.config({ duration: 5 });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
