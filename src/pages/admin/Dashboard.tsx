import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import NotificationPanel from '../../components/admin/NotificationPanel';
import ManualCreditingPanel from '../../components/admin/ManualCreditingPanel';
import AddInvestorModal from '../../components/admin/AddInvestorModal';
import LoadingScreen from '../../components/common/LoadingScreen';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions(); // Get all transactions
  const [addInvestorModalOpen, setAddInvestorModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Show loading screen for 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate comprehensive metrics from real Interactive Brokers data
  const totalAssets = investors.reduce((sum, investor) => sum + (investor.currentBalance || 0), 0);
  const totalInvestors = investors.length;
  const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'Pending').length;
  const activeInvestors = investors.filter(inv => !inv.accountStatus?.includes('Closed')).length;
  
  // Calculate total earnings across all investors
  const totalEarnings = investors.reduce((sum, investor) => {
    const earnings = investor.currentBalance - investor.initialDeposit;
    return sum + (earnings > 0 ? earnings : 0);
  }, 0);
  
  // Calculate pending withdrawal amount
  const pendingWithdrawalAmount = withdrawalRequests
    .filter(req => req.status === 'Pending')
    .reduce((sum, req) => sum + req.amount, 0);
  
  // Calculate total withdrawals processed from transactions
  const totalWithdrawalsProcessed = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0));
  
  // Calculate total deposits from transactions
  const totalDeposits = transactions
    .filter(tx => tx.type === 'Deposit' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Get top performing investors
  const topPerformers = investors
    .map(inv => ({
      ...inv,
      performance: inv.currentBalance - inv.initialDeposit,
      performancePercent: inv.initialDeposit > 0 ? ((inv.currentBalance - inv.initialDeposit) / inv.initialDeposit) * 100 : 0
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 3);

  if (isLoading) {
    return <LoadingScreen message="We're preparing your dashboard" />;
  }
  
  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || 'Admin'}</h2>
            <p className="text-gray-600 text-lg">Here's what's happening with your platform today</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setAddInvestorModalOpen(true)}
            className="shadow-lg"
          >
            <UserPlus size={18} className="mr-2" />
            Add Investor
          </Button>
        </div>
      </div>
      
      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Investors</p>
              <p className="text-3xl font-bold text-gray-900">{totalInvestors}</p>
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <ArrowUpRight size={14} className="mr-1" />
                {activeInvestors} active
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Assets Under Management</p>
              <p className="text-3xl font-bold text-gray-900">${totalAssets.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total portfolio value</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-green-600" size={24} />
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Withdrawals</p>
              <p className="text-3xl font-bold text-gray-900">${totalWithdrawalsProcessed.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <ArrowDownRight size={14} className="mr-1" />
                Processed successfully
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Withdrawals</p>
              <p className="text-3xl font-bold text-gray-900">{pendingWithdrawals}</p>
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertTriangle size={14} className="mr-1" />
                ${pendingWithdrawalAmount.toLocaleString()} total
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Platform Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="Platform Performance" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-blue-600" size={28} />
              </div>
              <p className="text-2xl font-bold text-blue-600">${totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Platform Earnings</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Target className="text-green-600" size={28} />
              </div>
              <p className="text-2xl font-bold text-green-600">${totalDeposits.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Deposits</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Activity className="text-red-600" size={28} />
              </div>
              <p className="text-2xl font-bold text-red-600">
                {totalDeposits > 0 ? ((totalEarnings / totalDeposits) * 100).toFixed(1) : '0.0'}%
              </p>
              <p className="text-sm text-gray-600">Average ROI</p>
            </div>
          </div>
        </Card>
        
        <Card title="Top Performers">
          <div className="space-y-4">
            {topPerformers.map((investor, index) => (
              <div key={investor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{investor.name}</p>
                    <p className="text-xs text-gray-500">{investor.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 text-sm">
                    +${investor.performance.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600">
                    +{investor.performancePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No performance data available</p>
            )}
          </div>
        </Card>
      </div>
      
      {/* Management Tools Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Manual Crediting Panel */}
        <div>
          <ManualCreditingPanel />
        </div>
        
        {/* Notifications Panel */}
        <div>
          <NotificationPanel />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => window.location.href = '/admin/investors'}>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <Activity className="text-blue-600" size={28} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Manage Investors</h3>
            <p className="text-gray-600">View and edit investor profiles</p>
          </div>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => window.location.href = '/admin/withdrawals'}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
              <DollarSign className="text-red-600" size={28} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Process Withdrawals</h3>
            <p className="text-gray-600">Review and approve requests</p>
          </div>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => window.location.href = '/admin/analytics'}>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <TrendingUp className="text-green-600" size={28} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">View Analytics</h3>
            <p className="text-gray-600">Platform performance insights</p>
          </div>
        </Card>
      </div>
      
      {/* Add Investor Modal */}
      <AddInvestorModal
        isOpen={addInvestorModalOpen}
        onClose={() => setAddInvestorModalOpen(false)}
        onSuccess={() => {
          setAddInvestorModalOpen(false);
          // Refresh the page to show new investor
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;