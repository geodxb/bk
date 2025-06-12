import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  LogOut, 
  User,
  ChevronDown,
  Users,
  DollarSign
} from 'lucide-react';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

interface NavItem {
  text: string;
  path: string;
  hasDropdown?: boolean;
  dropdownItems?: { text: string; path: string }[];
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items with dropdowns
  const navItems: NavItem[] = [
    { text: 'Dashboard', path: '/admin' },
    { 
      text: 'Holdings', 
      path: '/admin/investors',
      hasDropdown: true,
      dropdownItems: [
        { text: 'All Investors', path: '/admin/investors' },
        { text: 'Active Accounts', path: '/admin/investors?status=active' },
        { text: 'Restricted Accounts', path: '/admin/investors?status=restricted' }
      ]
    },
    { text: 'Reports', path: '/admin/analytics' },
    { 
      text: 'Planning', 
      path: '/admin/withdrawals',
      hasDropdown: true,
      dropdownItems: [
        { text: 'Withdrawal Requests', path: '/admin/withdrawals' },
        { text: 'Commission Tracking', path: '/admin/commissions' },
        { text: 'Transaction History', path: '/admin/analytics' }
      ]
    },
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

  const handleDropdownToggle = (itemText: string) => {
    setActiveDropdown(activeDropdown === itemText ? null : itemText);
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.hasDropdown) {
      handleDropdownToggle(item.text);
    } else {
      navigate(item.path);
      setActiveDropdown(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between min-h-[48px]">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-6">
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-6 w-auto object-contain"
                style={{ filter: 'none', boxShadow: 'none' }}
              />
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span className="font-medium">PortfolioAnalyst</span>
                <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded font-medium">MARKETS</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8 relative">
              {navItems.map((item, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleNavItemClick(item)}
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors py-3 px-1 ${
                      isActivePath(item.path)
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.text}</span>
                    {item.hasDropdown && (
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform ml-1 ${
                          activeDropdown === item.text ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {item.hasDropdown && activeDropdown === item.text && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              navigate(dropdownItem.path);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          >
                            {dropdownItem.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side - Quick Actions and User Menu */}
            <div className="flex items-center space-x-6">
              {/* Quick Action Buttons */}
              <div className="hidden lg:flex items-center space-x-3">
                <button
                  onClick={() => navigate('/admin/investors')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  Investors
                </button>
                <button
                  onClick={() => navigate('/admin/withdrawals')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                >
                  Withdrawals
                </button>
              </div>

              {/* User Info Links */}
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <button 
                  onClick={() => navigate('/admin')}
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Home
                </button>
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="hover:text-blue-600 transition-colors font-medium whitespace-nowrap"
                >
                  Performance & Reports
                </button>
                <button 
                  onClick={() => navigate('/admin/settings')}
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Settings
                </button>
              </div>

              {/* User Menu */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <User size={16} />
                <span className="hidden md:inline font-medium whitespace-nowrap">{user?.name}</span>
              </button>

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
                {/* Quick Actions for Mobile */}
                <div className="px-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate('/admin/investors');
                        setSidebarOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      <Users size={14} />
                      <span>Manage Investors</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/admin/withdrawals');
                        setSidebarOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <DollarSign size={14} />
                      <span>Process Withdrawals</span>
                    </button>
                  </div>
                </div>

                {/* Navigation Items */}
                {navItems.map((item, index) => (
                  <div key={index}>
                    <button
                      onClick={() => {
                        if (item.hasDropdown) {
                          handleDropdownToggle(item.text);
                        } else {
                          navigate(item.path);
                          setSidebarOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between w-full px-6 py-3 text-left transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      <span className="font-medium">{item.text}</span>
                      {item.hasDropdown && (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform ${
                            activeDropdown === item.text ? 'rotate-180' : ''
                          }`} 
                        />
                      )}
                    </button>
                    
                    {/* Mobile Dropdown */}
                    {item.hasDropdown && activeDropdown === item.text && (
                      <div className="bg-gray-50 border-l-2 border-blue-200">
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              navigate(dropdownItem.path);
                              setSidebarOpen(false);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-12 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            {dropdownItem.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* Click outside to close dropdowns */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveDropdown(null)}
        />
      )}

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
                <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
                  <span>Frequency: Daily</span>
                  <span>Performance Measure: TWR</span>
                  <span>Benchmark: Real-Time</span>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
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