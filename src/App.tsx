import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { CreditCardOutlined, HomeOutlined, MailOutlined, TableOutlined } from '@ant-design/icons';
import { ConfigProvider } from 'antd';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { HomePage } from '@/pages/HomePage';
import { VisualizerPage } from '@/pages/VisualizerPage';
import { theme } from '@/styles/antd-theme';
import './App.css';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: HomeOutlined },
  { path: '/visualizer', label: 'Visualizer', icon: TableOutlined },
  { path: '/contact', label: 'Contact', icon: MailOutlined },
  { path: '/billing', label: 'Billing', icon: CreditCardOutlined },
];

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="bg-primary h-6 w-1.5 rounded" />
          <div className="bg-primary h-4 w-1.5 rounded" />
        </div>
        <span className="text-primary text-lg font-semibold">RegionViz</span>
      </div>
      <ul className="flex gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary'
                    : 'hover:text-primary text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-gray-100">
          <Navigation />
          <main className="p-md flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/visualizer" element={<VisualizerPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
