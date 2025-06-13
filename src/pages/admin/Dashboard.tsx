import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { 
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign
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
  
  // Performance metrics for circular charts
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;
  const unprofitableInvestors = totalInvestors - profitableInvestors;
  const profitablePercentage = totalInvestors > 0 ? (profitableInvestors / totalInvestors) * 100 : 0;
  
  // Earnings statistics
  const totalEarningsTransactions = transactions.filter(tx => tx.type === 'Earnings').length;
  const totalDepositTransactions = transactions.filter(tx => tx.type === 'Deposit').length;
  const earningsPercentage = (totalEarningsTransactions + totalDepositTransactions) > 0 ? 
    (totalEarningsTransactions / (totalEarningsTransactions + totalDepositTransactions)) * 100 : 0;
  
  // Withdrawal statistics
  const approvedWithdrawals = withdrawalRequests.filter(req => req.status === 'Approved').length;
  const totalWithdrawalRequests = withdrawalRequests.length;
  const withdrawalSuccessRate = totalWithdrawalRequests > 0 ? (approvedWithdrawals / totalWithdrawalRequests) * 100 : 0;
  
  // Rejected withdrawal statistics
  const rejectedWithdrawals = withdrawalRequests.filter(req => req.status === 'Rejected').length;
  const rejectedPercentage = totalWithdrawalRequests > 0 ? (rejectedWithdrawals / totalWithdrawalRequests) * 100 : 0;

  // Circular progress component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#374151' }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="square"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Key Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Holdings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm font-medium">Asset Class</span>
                <span className="text-gray-600 text-sm font-medium">Market Value</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-600 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Cash</span>
                </div>
                <span className="font-semibold text-gray-900">${totalAssets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-gray-100 font-semibold">
                <span className="text-sm">Total</span>
                <span className="text-gray-900">${totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Key Statistics</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 font-medium">Net Asset Value USD</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">${totalAssets.toLocaleString()}</span>
                    <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">i</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 grid grid-cols-3 gap-4 font-medium">
                  <div>
                    <span className="block">Opening</span>
                    <span className="font-semibold text-gray-900">{totalDeposits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block">Change</span>
                    <span className="font-semibold text-gray-900">+{totalEarnings.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block">Percent</span>
                    <span className="font-semibold text-gray-900">{averageROI.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Deposits & Withdrawals USD</span>
                </div>
                <div className="text-xs text-gray-500 grid grid-cols-3 gap-4 mt-2 font-medium">
                  <div>
                    <span className="block">Deposits</span>
                    <span className="font-semibold text-gray-900">{totalDeposits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block">Withdrawals</span>
                    <span className="font-semibold text-gray-900">{totalWithdrawalsProcessed.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block">Net</span>
                    <span className="font-semibold text-gray-900">{(totalDeposits - totalWithdrawalsProcessed).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">What's New</h3>
            </div>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="text-gray-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Platform Updates</h4>
              <p className="text-sm text-gray-600 mb-4">
                Enhanced dashboard analytics and improved investor management tools are now available.
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Statistics and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Statistics with Circular Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Statistics</h3>
            </div>
            <div className="flex items-center justify-center mb-6">
              <CircularProgress 
                percentage={profitablePercentage} 
                size={140} 
                strokeWidth={12}
                color="#1E40AF"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-800 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Profitable Accounts</span>
                </div>
                <span className="font-semibold text-gray-900">{profitableInvestors}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Unprofitable Accounts</span>
                </div>
                <span className="font-semibold text-gray-900">{unprofitableInvestors}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">${totalAssets.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Assets Under Management</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Earnings Statistics</h3>
            </div>
            <div className="flex items-center justify-center mb-6">
              <CircularProgress 
                percentage={earningsPercentage} 
                size={140} 
                strokeWidth={12}
                color="#374151"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-700 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Earnings Transactions</span>
                </div>
                <span className="font-semibold text-gray-900">{totalEarningsTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Deposit Transactions</span>
                </div>
                <span className="font-semibold text-gray-900">{totalDepositTransactions}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">${totalEarnings.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Platform Earnings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Statistics and Rejected Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Withdrawal Statistics</h3>
            </div>
            <div className="flex items-center justify-center mb-6">
              <CircularProgress 
                percentage={withdrawalSuccessRate} 
                size={140} 
                strokeWidth={12}
                color="#374151"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-700 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Approved Withdrawals</span>
                </div>
                <span className="font-semibold text-gray-900">{approvedWithdrawals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Pending Requests</span>
                </div>
                <span className="font-semibold text-gray-900">{pendingWithdrawals}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">${totalWithdrawalsProcessed.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Withdrawals Processed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejected Withdrawal Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Rejection Statistics</h3>
            </div>
            <div className="flex items-center justify-center mb-6">
              <CircularProgress 
                percentage={rejectedPercentage} 
                size={140} 
                strokeWidth={12}
                color="#991B1B"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-800 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Rejected Requests</span>
                </div>
                <span className="font-semibold text-gray-900">{rejectedWithdrawals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Total Requests</span>
                </div>
                <span className="font-semibold text-gray-900">{totalWithdrawalRequests}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{rejectedWithdrawals}</div>
                  <div className="text-sm text-gray-600 font-medium">Rejected Withdrawal Requests</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;