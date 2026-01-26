import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { theme } from '@/styles/antd-theme';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { VisualizerPage } from './pages/VisualizerPage';
import './App.css';

function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-primary px-6 py-4">
            <ul className="flex gap-6">
              <li>
                <Link to="/" className="hover:text-primary-200 text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/visualizer"
                  className="hover:text-primary-200 text-white transition-colors"
                >
                  Visualizer
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-200 text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-200 text-white transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </nav>
          <main className="mx-auto max-w-7xl px-6 py-8">
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
