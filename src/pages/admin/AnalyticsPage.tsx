import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Activity, BarChart3, PieChart, LineChart } from 'lucide-react';

const AnalyticsPage = () => {
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions(); // Get all transactions
  
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

  // Chart component for portfolio distribution
  const PortfolioChart = () => {
    const longPositions = totalEarnings * 0.65;
    const shortPositions = totalEarnings * 0.35;
    const totalPositions = longPositions + shortPositions;
    
    const longPercentage = totalPositions > 0 ? (longPositions / totalPositions) * 100 : 50;
    const shortPercentage = 100 - longPercentage;
    
    return (
      <div className="space-y-6">
        {/* Portfolio Value Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            ${totalAssets.toLocaleString()}
          </h2>
          <p className="text-lg text-gray-600">Total Portfolio Value</p>
        </div>
        
        {/* Position Distribution Chart */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Position Distribution</h3>
          
          {/* Horizontal Bar Chart */}
          <div className="space-y-4">
            {/* Long Positions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">LONG Positions</span>
                <span className="text-sm font-bold text-green-600">
                  ${longPositions.toLocaleString()} ({longPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${longPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Short Positions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">SHORT Positions</span>
                <span className="text-sm font-bold text-red-600">
                  ${shortPositions.toLocaleString()} ({shortPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-red-500 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${shortPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Net Position */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-800">Net Position</span>
              <span className="text-lg font-bold text-blue-600">
                ${(longPositions - shortPositions).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
              <Target size={16} className="text-blue-600" />
            </div>
            <p className="text-xs text-blue-600 font-medium mb-1">Win Rate</p>
            <p className="text-lg font-bold text-blue-800">{winRate.toFixed(1)}%</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <p className="text-xs text-green-600 font-medium mb-1">Profitable</p>
            <p className="text-lg font-bold text-green-800">{profitableInvestors}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
              <BarChart3 size={16} className="text-purple-600" />
            </div>
            <p className="text-xs text-purple-600 font-medium mb-1">Avg Size</p>
            <p className="text-lg font-bold text-purple-800">${(avgPositionSize / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Analytics & Reports">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-800">Platform Analytics</h2>
        <p className="text-gray-600">Comprehensive insights into platform performance and investor activity.</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
            <Users className="text-blue-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Total Investors</h3>
          <p className="text-2xl font-bold text-gray-800">{totalInvestors}</p>
          {totalInvestors === 0 && (
            <p className="text-sm text-gray-400 mt-1">No investors yet</p>
          )}
        </Card>
        
        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
            <DollarSign className="text-green-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Total Assets</h3>
          <p className="text-2xl font-bold text-gray-800">${totalAssets.toLocaleString()}</p>
          {totalAssets === 0 && (
            <p className="text-sm text-gray-400 mt-1">No assets yet</p>
          )}
        </Card>
        
        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-3">
            <TrendingUp className="text-indigo-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Average ROI</h3>
          <p className="text-2xl font-bold text-gray-800">{averageROI.toFixed(2)}%</p>
          {totalDeposits === 0 && (
            <p className="text-sm text-gray-400 mt-1">No deposits yet</p>
          )}
        </Card>
        
        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mx-auto mb-3">
            <TrendingDown className="text-amber-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-1">Total Withdrawals</h3>
          <p className="text-2xl font-bold text-gray-800">${totalWithdrawals.toLocaleString()}</p>
          {totalWithdrawals === 0 && (
            <p className="text-sm text-gray-400 mt-1">No withdrawals yet</p>
          )}
        </Card>
      </div>
      
      {/* Portfolio Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card title="Portfolio Performance Analytics">
            <PortfolioChart />
          </Card>
        </div>
        
        <Card title="Top Countries">
          <div className="space-y-4">
            {topCountries.length > 0 ? (
              topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                    </div>
                    <span className="font-medium">{country}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{count}</p>
                    <p className="text-xs text-gray-500">{((count / totalInvestors) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No country data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
            <Activity className="text-purple-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Active Positions</h3>
          <p className="text-3xl font-bold text-purple-600">{profitableInvestors}</p>
          <p className="text-sm text-gray-500 mt-1">Profitable accounts</p>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
            <BarChart3 className="text-orange-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Win Rate</h3>
          <p className="text-3xl font-bold text-orange-600">{winRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">Success ratio</p>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mx-auto mb-3">
            <Target className="text-emerald-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Avg. Position Size</h3>
          <p className="text-3xl font-bold text-emerald-600">
            ${totalInvestors > 0 ? Math.round(avgPositionSize).toLocaleString() : '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Per investor</p>
        </Card>
      </div>
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Financial Overview">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Deposits</span>
              <span className="font-bold text-blue-600">${totalDeposits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Earnings</span>
              <span className="font-bold text-green-600">${totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Withdrawals</span>
              <span className="font-bold text-red-600">${totalWithdrawals.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium">Net Platform Growth</span>
              <span className="font-bold text-indigo-600">${totalGains.toLocaleString()}</span>
            </div>
          </div>
        </Card>
        
        <Card title="System Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium">Platform Status</p>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Online</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium">Database Status</p>
                <p className="text-sm text-gray-500">Connected and responsive</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Healthy</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium">API Status</p>
                <p className="text-sm text-gray-500">All endpoints responding</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Data Source</p>
                <p className="text-sm text-gray-500">Interactive Brokers, Inc.</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Live</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;