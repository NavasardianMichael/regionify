import * as Sentry from '@sentry/react';
import { AntdProvider } from '@/components/antd/AntdProvider';
import { AppRouter } from '@/components/router/AppRouter';
import { AuthSync } from '@/components/shared/AuthSync';
import { LocaleSync } from '@/components/shared/LocaleSync';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import './App.css';

function App() {
  return (
    <AntdProvider>
      <Sentry.ErrorBoundary fallback={<ErrorFallback showGoHome />}>
        <AuthSync />
        <LocaleSync />
        <AppRouter />
      </Sentry.ErrorBoundary>
    </AntdProvider>
  );
}

export default App;
