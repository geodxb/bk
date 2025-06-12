import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Globe, 
  DollarSign,
  Clock,
  Save,
  RefreshCw,
  Building,
  Lock
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    timezone: 'UTC-5 (Eastern Time)',
  });
  
  // Platform settings are now read-only
  const platformSettings = {
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    withdrawalFee: 2.5,
    processingTime: '1-3 business days',
    maintenanceMode: false,
  };
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    withdrawalAlerts: true,
    newInvestorAlerts: true,
    systemAlerts: true,
    weeklyReports: true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card title="Admin Profile">
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={32} className="text-gray-500" />
                </div>
                <div>
                  <Button variant="outline" size="sm" disabled>Change Photo</Button>
                  <p className="text-sm text-gray-500 mt-1">Profile picture disabled</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC-6 (Central Time)</option>
                    <option>UTC-7 (Mountain Time)</option>
                    <option>UTC-8 (Pacific Time)</option>
                  </select>
                </div>
              </div>

              {/* Bank Information Section */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Building size={20} className="mr-2" />
                  Bank Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <p className="text-gray-800 font-medium">ADCB (Abu Dhabi Commercial Bank)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                      <p className="text-gray-800 font-medium">13*********0001</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                      <p className="text-gray-800 font-medium">AE68003001*********0001</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
        
      case 'platform':
        return (
          <Card title="Platform Settings">
            <div className="space-y-6">
              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Lock size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="text-amber-800 font-semibold">Settings Locked</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      Platform settings are locked for security and stability. These critical system parameters 
                      cannot be modified through the interface to prevent unauthorized changes that could affect 
                      platform operations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Withdrawal ($)
                    <Lock size={14} className="inline ml-2 text-gray-400" />
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={platformSettings.minWithdrawal}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">System-controlled setting</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Withdrawal ($)
                    <Lock size={14} className="inline ml-2 text-gray-400" />
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={platformSettings.maxWithdrawal}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">System-controlled setting</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Fee (%)
                    <Lock size={14} className="inline ml-2 text-gray-400" />
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={platformSettings.withdrawalFee}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">System-controlled setting</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Time
                    <Lock size={14} className="inline ml-2 text-gray-400" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={platformSettings.processingTime}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">System-controlled setting</p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                      Maintenance Mode
                      <Lock size={16} className="ml-2 text-gray-400" />
                    </h3>
                    <p className="text-sm text-gray-600">System maintenance controls are locked for security</p>
                  </div>
                  <div className="relative">
                    <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                      <input
                        type="checkbox"
                        checked={platformSettings.maintenanceMode}
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <Lock size={14} className="absolute -top-1 -right-1 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Additional Security Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-800 font-semibold mb-2">Security Information</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Platform settings are protected against unauthorized modifications</li>
                  <li>• Changes to these settings require system administrator access</li>
                  <li>• All settings are monitored and logged for security purposes</li>
                  <li>• Contact system administrator for any required changes</li>
                </ul>
              </div>
            </div>
          </Card>
        );
        
      case 'notifications':
        return (
          <Card title="Notification Settings">
            <div className="space-y-6">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {key === 'emailNotifications' && 'Receive email notifications for important events'}
                      {key === 'withdrawalAlerts' && 'Get notified when withdrawal requests are submitted'}
                      {key === 'newInvestorAlerts' && 'Receive alerts when new investors register'}
                      {key === 'systemAlerts' && 'Get notified about system issues and maintenance'}
                      {key === 'weeklyReports' && 'Receive weekly performance and activity reports'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        );
        
      case 'security':
        return (
          <Card title="Security Settings">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button variant="primary">Update Password</Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Add an extra layer of security to your account</p>
                    <p className="text-sm text-gray-500">Status: <span className="text-red-600">Disabled</span></p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Login Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-gray-500">Chrome on Windows • New York, NY</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-gray-500">iPhone • Last seen 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">Revoke</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
        
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'platform', label: 'Platform', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-800">Admin Settings</h2>
        <p className="text-gray-600">Manage your account and platform configuration.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'platform' && (
                    <Lock size={14} className="ml-auto text-gray-400" />
                  )}
                </button>
              ))}
            </nav>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
          
          {/* Save Button - Only show for editable sections */}
          {activeTab !== 'platform' && (
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline">
                <RefreshCw size={18} className="mr-2" />
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isLoading}
              >
                <Save size={18} className="mr-2" />
                {isSaved ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;