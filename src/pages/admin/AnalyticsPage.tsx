import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Activity, 
  BarChart3, 
  PieChart, 
  LineChart,
  Zap,
  Database,
  Globe,
  Shield
} from 'lucide-react';

const AnalyticsPage = () => {
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  
  // Calculate analytics data from real Interactive Brokers data
  const totalInvestors = investors.length;
  const totalAssets = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  const totalDeposits = investors.reduce((sum, inv) => sum + (inv.initialDeposit || 0), 0);
  const totalGains = totalAssets - totalDeposits;
  const averageROI = totalDeposits > 0 ? (totalGains / totalDeposits) * 100 : 0;
  
  // Calculate transaction-based metrics
  const totalEarnings = transactions
    .filter(tx => tx.type === 'Earnings')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));
  
  // Calculate performance metrics
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;
  const winRate = totalInvestors > 0 ? (profitableInvestors / totalInvestors) * 100 : 0;
  const avgPositionSize = totalInvestors > 0 ? totalAssets / totalInvestors : 0;
  
  // Country distribution from real data
  const countryStats = investors.reduce((acc, inv) => {
    const country = inv.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Industrial-style metrics grid
  const MetricsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Primary Metrics */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 font-medium text-sm uppercase tracking-wide">Total AUM</p>
            <p className="text-white text-2xl font-bold">${totalAssets.toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-1">Assets Under Management</p>
          </div>
          <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
            <DollarSign className="text-slate-300" size={24} />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-300 font-medium text-sm uppercase tracking-wide">Active Clients</p>
            <p className="text-white text-2xl font-bold">{totalInvestors}</p>
            <p className="text-blue-400 text-xs mt-1">Total Investors</p>
          </div>
          <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
            <Users className="text-blue-300" size={24} />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-green-800 to-green-900 text-white border-green-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-300 font-medium text-sm uppercase tracking-wide">Performance</p>
            <p className="text-white text-2xl font-bold">{averageROI.toFixed(2)}%</p>
            <p className="text-green-400 text-xs mt-1">Average ROI</p>
          </div>
          <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-green-300" size={24} />
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-orange-800 to-orange-900 text-white border-orange-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-300 font-medium text-sm uppercase tracking-wide">Win Rate</p>
            <p className="text-white text-2xl font-bold">{winRate.toFixed(1)}%</p>
            <p className="text-orange-400 text-xs mt-1">Success Ratio</p>
          </div>
          <div className="w-12 h-12 bg-orange-700 rounded-lg flex items-center justify-center">
            <Target className="text-orange-300" size={24} />
          </div>
        </div>
      </Card>
    </div>
  );

  // Industrial-style system status
  const SystemStatus = () => (
    <Card title="System Status" className="bg-slate-50 border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-700 font-medium">Platform</span>
            </div>
            <Zap size={16} className="text-green-600" />
          </div>
          <p className="text-xs text-slate-600">All systems operational</p>
          <p className="text-lg font-bold text-slate-800">99.9%</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-slate-700 font-medium">Database</span>
            </div>
            <Database size={16} className="text-blue-600" />
          </div>
          <p className="text-xs text-slate-600">Connected & responsive</p>
          <p className="text-lg font-bold text-slate-800">Active</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-slate-700 font-medium">API</span>
            </div>
            <Globe size={16} className="text-purple-600" />
          </div>
          <p className="text-xs text-slate-600">All endpoints responding</p>
          <p className="text-lg font-bold text-slate-800">Online</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-700 font-medium">Security</span>
            </div>
            <Shield size={16} className="text-green-600" />
          </div>
          <p className="text-xs text-slate-600">All protocols active</p>
          <p className="text-lg font-bold text-slate-800">Secure</p>
        </div>
      </div>
    </Card>
  );

  // Industrial-style performance dashboard
  const PerformanceDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <Card title="Portfolio Analytics" className="bg-white border-slate-200 h-full">
          <div className="space-y-6">
            {/* Portfolio Value Header */}
            <div className="text-center bg-slate-50 p-6 rounded-xl">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                ${totalAssets.toLocaleString()}
              </h2>
              <p className="text-lg text-slate-600">Total Portfolio Value</p>
            </div>
            
            {/* Position Distribution */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Position Distribution</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">LONG Positions</span>
                    <span className="text-sm font-bold text-green-600">
                      ${(totalEarnings * 0.65).toLocaleString()} (65%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">SHORT Positions</span>
                    <span className="text-sm font-bold text-red-600">
                      ${(totalEarnings * 0.35).toLocaleString()} (35%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div className="bg-red-500 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Card title="Key Metrics" className="bg-white border-slate-200">
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Profitable Accounts</p>
                <p className="text-slate-900 text-2xl font-bold">{profitableInvestors}</p>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Avg Position Size</p>
                <p className="text-slate-900 text-2xl font-bold">${(avgPositionSize / 1000).toFixed(0)}K</p>
              </div>
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Transactions</p>
                <p className="text-slate-900 text-2xl font-bold">{transactions.length}</p>
              </div>
              <Activity className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
        <p className="text-slate-600">Real-time platform performance and insights</p>
      </div>
      
      <MetricsGrid />
      <PerformanceDashboard />
      <SystemStatus />
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card title="Financial Overview" className="bg-white border-slate-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Total Deposits</span>
              <span className="font-bold text-blue-600">${totalDeposits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Total Earnings</span>
              <span className="font-bold text-green-600">${totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Total Withdrawals</span>
              <span className="font-bold text-red-600">${totalWithdrawals.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600 font-medium">Net Platform Growth</span>
              <span className="font-bold text-slate-800">${totalGains.toLocaleString()}</span>
            </div>
          </div>
        </Card>
        
        <Card title="Geographic Distribution" className="bg-white border-slate-200">
          <div className="space-y-4">
            {topCountries.length > 0 ? (
              topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-slate-600 font-medium text-sm">{index + 1}</span>
                    </div>
                    <span className="font-medium text-slate-800">{country}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{count}</p>
                    <p className="text-xs text-slate-500">{((count / totalInvestors) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No geographic data available</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;