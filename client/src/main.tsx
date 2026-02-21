import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { message } from 'antd';
import App from './App.tsx';
import './index.css';

import '@/i18n';

// Messages stay until user closes them (no autohide)
message.config({ duration: 0 });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
