import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Home from '@/pages/Home';
import Visualizer from '@/pages/Visualizer';
import { theme } from '@/styles/antd-theme';
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
              <Route path="/" element={<Home />} />
              <Route path="/visualizer" element={<Visualizer />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
