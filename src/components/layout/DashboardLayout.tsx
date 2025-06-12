import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  LogOut, 
  User
} from 'lucide-react';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items without icons
  const navItems = [
    { text: 'Dashboard', path: '/admin' },
    { text: 'Holdings', path: '/admin/investors' },
    { text: 'Reports', path: '/admin/analytics' },
    { text: 'Planning', path: '/admin/withdrawals' },
    { text: 'Configuration', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const isActivePath = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-8 w-auto object-contain"
                style={{ filter: 'none', boxShadow: 'none' }}
              />
              <div className="text-sm text-gray-600">
                <span className="font-medium">PortfolioAnalyst</span>
                <span className="ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">MARKETS</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>Home</span>
                <span>Performance & Reports</span>
                <span>Settings</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <User size={16} />
                <span className="hidden md:inline">{user?.name}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl md:hidden border-r border-gray-100"
            >
              <div className="p-6 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center">
                  <img 
                    src="/Screenshot 2025-06-07 024813.png" 
                    alt="Interactive Brokers" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-6">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center w-full px-6 py-3 text-left transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <span className="font-medium">{item.text}</span>
                  </button>
                ))}

                <div className="px-6 py-3 mt-6 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={18} className="mr-3" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb/Title Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium text-gray-900">{title}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <span>2025-01-07 to 2025-01-07</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="mr-4">Frequency: Daily</span>
                  <span className="mr-4">Performance Measure: TWR</span>
                  <span>Benchmark: Real-Time</span>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Configure Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;