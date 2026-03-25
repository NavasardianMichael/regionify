import { AntdProvider } from '@/components/antd/AntdProvider';
import { AppRouter } from '@/components/router/AppRouter';
import { AuthSync } from '@/components/shared/AuthSync';
import { LocaleSync } from '@/components/shared/LocaleSync';
import './App.css';

function App() {
  return (
    <AntdProvider>
      <AuthSync />
      <LocaleSync />
      <AppRouter />
    </AntdProvider>
  );
}

export default App;
