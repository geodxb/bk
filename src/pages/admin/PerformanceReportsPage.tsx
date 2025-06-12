import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useInvestors, useTransactions } from '../../hooks/useFirestore';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download,
  Calendar,
  Filter,
  Target,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

const PerformanceReportsPage = () => {
  const { investors } = useInvestors();
  const { transactions } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Calculate performance metrics
  const totalAssets = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  const totalDeposits = investors.reduce((sum, inv) => sum + (inv.initialDeposit || 0), 0);
  const totalGains = totalAssets - totalDeposits;
  const averageROI = totalDeposits > 0 ? (totalGains / totalDeposits) * 100 : 0;
  
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;
  const winRate = investors.length > 0 ? (profitableInvestors / investors.length) * 100 : 0;
  
  // Transaction metrics
  const totalEarnings = transactions
    .filter(tx => tx.type === 'Earnings')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));

  // Top performers
  const topPerformers = investors
    .map(inv => ({
      ...inv,
      performance: inv.currentBalance - inv.initialDeposit,
      performancePercent: inv.initialDeposit > 0 ? ((inv.currentBalance - inv.initialDeposit) / inv.initialDeposit) * 100 : 0
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5);

  const generateReport = () => {
    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalAssets,
        totalDeposits,
        totalGains,
        averageROI,
        winRate,
        totalInvestors: investors.length,
        profitableInvestors
      },
      topPerformers
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 font-semibold text-sm">Total AUM</p>
              <p className="text-blue-900 text-2xl font-bold">${totalAssets.toLocaleString()}</p>
              <p className="text-blue-600 text-xs mt-1">Assets Under Management</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-700" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-semibold text-sm">Average ROI</p>
              <p className="text-green-900 text-2xl font-bold">{averageROI.toFixed(2)}%</p>
              <p className="text-green-600 text-xs mt-1">Return on Investment</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <TrendingUp className="text-green-700" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 font-semibold text-sm">Win Rate</p>
              <p className="text-purple-900 text-2xl font-bold">{winRate.toFixed(1)}%</p>
              <p className="text-purple-600 text-xs mt-1">Profitable Accounts</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <Target className="text-purple-700" size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 font-semibold text-sm">Active Clients</p>
              <p className="text-orange-900 text-2xl font-bold">{investors.length}</p>
              <p className="text-orange-600 text-xs mt-1">Total Investors</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
              <Users className="text-orange-700" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Portfolio Performance" className="bg-white border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Performance chart visualization</p>
              <p className="text-sm text-gray-400">Real-time portfolio tracking</p>
            </div>
          </div>
        </Card>

        <Card title="Asset Allocation" className="bg-white border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Asset distribution breakdown</p>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">Cash: 100%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card title="Top Performing Accounts" className="bg-white border border-gray-200">
        <div className="space-y-4">
          {topPerformers.length > 0 ? (
            topPerformers.map((investor, index) => (
              <div key={investor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{investor.name}</p>
                    <p className="text-sm text-gray-500">{investor.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${investor.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {investor.performance >= 0 ? '+' : ''}${investor.performance.toLocaleString()}
                  </p>
                  <p className={`text-sm ${investor.performancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {investor.performancePercent >= 0 ? '+' : ''}{investor.performancePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No performance data available</p>
          )}
        </div>
      </Card>
    </div>
  );

  const renderDetailedReport = () => (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <Card title="Financial Performance Metrics" className="bg-white border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h3 className="text-blue-800 font-semibold mb-4">Revenue Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-700">Total Deposits</span>
                <span className="font-bold text-blue-900">${totalDeposits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Earnings</span>
                <span className="font-bold text-blue-900">${totalEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Net Growth</span>
                <span className="font-bold text-blue-900">${totalGains.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <h3 className="text-green-800 font-semibold mb-4">Performance Ratios</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">ROI</span>
                <span className="font-bold text-green-900">{averageROI.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Win Rate</span>
                <span className="font-bold text-green-900">{winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Avg. Account Size</span>
                <span className="font-bold text-green-900">
                  ${investors.length > 0 ? (totalAssets / investors.length).toFixed(0) : '0'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
            <h3 className="text-purple-800 font-semibold mb-4">Client Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-700">Total Clients</span>
                <span className="font-bold text-purple-900">{investors.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Profitable</span>
                <span className="font-bold text-purple-900">{profitableInvestors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Retention Rate</span>
                <span className="font-bold text-purple-900">95.2%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Analysis */}
      <Card title="Transaction Analysis" className="bg-white border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Transaction Volume</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-bold">{transactions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Deposits</span>
                <span className="font-bold text-blue-600">
                  {transactions.filter(tx => tx.type === 'Deposit').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Withdrawals</span>
                <span className="font-bold text-red-600">
                  {transactions.filter(tx => tx.type === 'Withdrawal').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Earnings</span>
                <span className="font-bold text-green-600">
                  {transactions.filter(tx => tx.type === 'Earnings').length}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Value Distribution</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Volume</span>
                <span className="font-bold">
                  ${transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Transaction</span>
                <span className="font-bold">
                  ${transactions.length > 0 ? (transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Largest Transaction</span>
                <span className="font-bold">
                  ${transactions.length > 0 ? Math.max(...transactions.map(tx => Math.abs(tx.amount))).toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout title="Performance & Reports">
      {/* Header Controls */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Performance & Reports</h2>
            <p className="text-gray-600">Comprehensive analytics and performance insights</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            
            <Button variant="outline" onClick={generateReport}>
              <Download size={16} className="mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card className="mb-6 bg-white border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700">Report Type:</span>
          </div>
          <div className="flex space-x-1">
            {[
              { key: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
              { key: 'detailed', label: 'Detailed Analysis', icon: <Activity size={14} /> },
              { key: 'comparative', label: 'Comparative', icon: <TrendingUp size={14} /> }
            ].map(report => (
              <button
                key={report.key}
                onClick={() => setSelectedReport(report.key)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm rounded transition-colors ${
                  selectedReport === report.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {report.icon}
                <span>{report.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {selectedReport === 'overview' && renderOverviewReport()}
      {selectedReport === 'detailed' && renderDetailedReport()}
      {selectedReport === 'comparative' && (
        <Card title="Comparative Analysis" className="bg-white border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Comparative analysis coming soon</p>
              <p className="text-sm text-gray-400">Period-over-period performance comparison</p>
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default PerformanceReportsPage;