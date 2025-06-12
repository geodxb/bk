import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  LogOut, 
  Home, 
  Users, 
  BarChart4, 
  Clock, 
  User,
  DollarSign,
  Settings,
  Percent
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

  // Only admin navigation items
  const navItems = [
    { icon: <Home size={20} />, text: 'Dashboard', path: '/admin' },
    { icon: <Users size={20} />, text: 'Investors', path: '/admin/investors' },
    { icon: <DollarSign size={20} />, text: 'Withdrawals', path: '/admin/withdrawals' },
    { icon: <Percent size={20} />, text: 'Commissions', path: '/admin/commissions' },
    { icon: <BarChart4 size={20} />, text: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={20} />, text: 'Settings', path: '/admin/settings' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center px-4 py-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="w-8">
            {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      {/* Sidebar (Mobile) */}
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
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center justify-center mb-3">
                    <img 
                      src="/Screenshot 2025-06-07 023015.png" 
                      alt="Interactive Brokers" 
                      className="h-12 w-auto object-contain"
                      style={{ filter: 'none', boxShadow: 'none' }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 font-medium text-center">Affiliate Dashboard</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none absolute top-6 right-6"
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
                    className={`flex items-center w-full px-6 py-3 transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <span className={`mr-3 ${isActivePath(item.path) ? 'text-blue-600' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.text}</span>
                  </button>
                ))}

                <div className="px-6 py-3 mt-6 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={20} className="mr-3 text-gray-400" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-10 md:w-72 md:bg-white md:shadow-sm md:flex md:flex-col md:border-r md:border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-center mb-3">
              <img 
                src="/Screenshot 2025-06-07 023015.png" 
                alt="Interactive Brokers" 
                className="h-12 w-auto object-contain"
                style={{ filter: 'none', boxShadow: 'none' }}
              />
            </div>
            <span className="text-sm text-gray-600 font-medium text-center">Affiliate Dashboard</span>
          </div>
        </div>

        <div className="flex-1 py-6 flex flex-col justify-between">
          <div>
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full px-6 py-3 transition-colors ${
                  isActivePath(item.path)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <span className={`mr-3 ${isActivePath(item.path) ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.text}</span>
              </button>
            ))}
          </div>

          <div className="px-6 mt-6 border-t border-gray-100 pt-6">
            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center mr-3">
                <User size={20} className="text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
            >
              <LogOut size={18} className="mr-3 text-gray-400" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-72 pt-16 md:pt-0">
        {/* Page Header (Desktop) */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-100">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;