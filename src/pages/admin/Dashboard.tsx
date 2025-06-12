import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
  Target,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  
  // Calculate metrics from real data
  const totalAssets = investors.reduce((sum, investor) => sum + (investor.currentBalance || 0), 0);
  const totalInvestors = investors.length;
  const activeInvestors = investors.filter(inv => !inv.accountStatus?.includes('Closed')).length;
  const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'Pending').length;
  const pendingWithdrawalAmount = withdrawalRequests
    .filter(req => req.status === 'Pending')
    .reduce((sum, req) => sum + req.amount, 0);
  
  const totalWithdrawalsProcessed = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0));
  
  const totalDeposits = transactions
    .filter(tx => tx.type === 'Deposit' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalEarnings = investors.reduce((sum, investor) => {
    const earnings = investor.currentBalance - investor.initialDeposit;
    return sum + (earnings > 0 ? earnings : 0);
  }, 0);
  
  const averageROI = totalDeposits > 0 ? ((totalEarnings / totalDeposits) * 100) : 0;
  
  // Get top performing investors
  const topPerformers = investors
    .map(inv => ({
      ...inv,
      performance: inv.currentBalance - inv.initialDeposit,
      performancePercent: inv.initialDeposit > 0 ? ((inv.currentBalance - inv.initialDeposit) / inv.initialDeposit) * 100 : 0
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 3);

  return (
    <DashboardLayout title="Dashboard">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || 'Cristian Rolando Dorao'}</h2>
            <p className="text-gray-600 text-lg">Here's what's happening with your platform today</p>
          </div>
          <Button
            variant="primary"
            className="shadow-lg"
          >
            <UserPlus size={18} className="mr-2" />
            Add Investor
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Investors</p>
              <p className="text-3xl font-bold text-gray-900">{totalInvestors}</p>
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <Users size={14} className="mr-1" />
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
      
      {/* Platform Performance and Top Performers */}
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
                {averageROI.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Average ROI</p>
            </div>
          </div>
        </Card>
        
        <Card title="Top Performers">
          <div className="space-y-4">
            {topPerformers.length > 0 ? topPerformers.map((investor, index) => (
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
            )) : (
              <p className="text-gray-500 text-center py-4">No performance data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Key Statistics Section - Interactive Brokers Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="Holdings" className="bg-white border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">Asset Class</span>
              <span className="text-gray-600 text-sm">Market Value</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Cash</span>
              </div>
              <span className="font-medium">${totalAssets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100 font-semibold">
              <span className="text-sm">Total</span>
              <span>${totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card title="Key Statistics" className="bg-white border border-gray-200">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Net Asset Value USD</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">${totalAssets.toLocaleString()}</span>
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">i</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 grid grid-cols-3 gap-4">
                <div>
                  <span className="block">Opening</span>
                  <span className="font-medium">{totalDeposits.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Change</span>
                  <span className="font-medium text-green-600">+{totalEarnings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Percent</span>
                  <span className="font-medium">{averageROI.toFixed(2)}%</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deposits & Withdrawals USD</span>
              </div>
              <div className="text-xs text-gray-500 grid grid-cols-3 gap-4 mt-2">
                <div>
                  <span className="block">Deposits</span>
                  <span className="font-medium">{totalDeposits.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Withdrawals</span>
                  <span className="font-medium">{totalWithdrawalsProcessed.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Net</span>
                  <span className="font-medium">{(totalDeposits - totalWithdrawalsProcessed).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="What's New" className="bg-white border border-gray-200">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Platform Updates</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enhanced dashboard analytics and improved investor management tools are now available.
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart and Portfolio Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Performance" className="bg-white border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Performance chart will be displayed here</p>
              <p className="text-sm text-gray-400">Based on platform transaction data</p>
            </div>
          </div>
        </Card>

        <Card title="Portfolio Movers" className="bg-white border border-gray-200">
          <div className="space-y-4">
            <div className="text-xs text-gray-500 grid grid-cols-3 gap-4 pb-2 border-b border-gray-100">
              <span>Symbol</span>
              <span className="text-right">Avg Weight %</span>
              <span className="text-right">CTR %</span>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm grid grid-cols-3 gap-4 items-center">
                <span className="font-medium">USD</span>
                <span className="text-right">100.00</span>
                <span className="text-right text-green-600">0.00</span>
              </div>
              
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bottom Performers</h4>
                <div className="text-sm grid grid-cols-3 gap-4 items-center">
                  <span className="font-medium">N/A</span>
                  <span className="text-right">0.00</span>
                  <span className="text-right">0.00</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Allocation and Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Allocation" className="bg-white border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Asset allocation breakdown</p>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Cash: 100%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Attribution vs. S&P 500" className="bg-white border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Performance attribution analysis</p>
              <p className="text-sm text-gray-400 mt-2">Compared to market benchmark</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </DashboardLayout>
  );
};

export default AdminDashboard;