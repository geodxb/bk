import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import CommissionWithdrawalModal from '../../components/admin/CommissionWithdrawalModal';
import { useCommissions } from '../../hooks/useCommissions';
import { 
  Percent, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  User,
  CreditCard,
  ArrowUpRight,
  Wallet,
  ArrowDownRight,
  Building,
  Banknote
} from 'lucide-react';

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'year';

const CommissionsPage = () => {
  const { commissions, totalCommissions, loading, error } = useCommissions();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  // Filter commissions based on period
  const filteredCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.date);
    const now = new Date();
    
    let matchesPeriod = true;
    
    switch (filterPeriod) {
      case 'today':
        matchesPeriod = commissionDate.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesPeriod = commissionDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchesPeriod = commissionDate >= monthAgo;
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        matchesPeriod = commissionDate >= yearAgo;
        break;
      default:
        matchesPeriod = true;
    }
    
    const matchesSearch = commission.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.withdrawalAmount.toString().includes(searchTerm) ||
      commission.commissionAmount.toString().includes(searchTerm);
    
    return matchesPeriod && matchesSearch;
  });

  // Calculate filtered totals
  const filteredTotal = filteredCommissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
  const filteredWithdrawalTotal = filteredCommissions.reduce((sum, commission) => sum + commission.withdrawalAmount, 0);

  // Calculate period statistics
  const todayCommissions = commissions.filter(c => 
    new Date(c.date).toDateString() === new Date().toDateString()
  ).reduce((sum, c) => sum + c.commissionAmount, 0);

  const thisMonthCommissions = commissions.filter(c => {
    const date = new Date(c.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, c) => sum + c.commissionAmount, 0);

  const averageCommission = commissions.length > 0 ? totalCommissions / commissions.length : 0;

  const columns = [
    {
      key: 'investorName',
      header: 'Investor Details',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">ID: {row.investorId.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'withdrawalAmount',
      header: 'Withdrawal Details',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end space-x-1">
            <ArrowDownRight size={14} className="text-red-500" />
            <p className="font-semibold text-gray-800">${value.toLocaleString()}</p>
          </div>
          <p className="text-xs text-gray-500">Withdrawal amount</p>
          <p className="text-xs text-blue-600">{row.date}</p>
        </div>
      )
    },
    {
      key: 'commissionRate',
      header: 'Commission Rate',
      align: 'center' as 'center',
      render: (value: number) => (
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-sm font-bold rounded-full">
            <Percent size={12} className="mr-1" />
            {value}%
          </span>
        </div>
      )
    },
    {
      key: 'commissionAmount',
      header: 'Commission Earned',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end space-x-1">
            <ArrowUpRight size={14} className="text-green-500" />
            <p className="font-bold text-xl text-green-600">${value.toLocaleString()}</p>
          </div>
          <div className="flex items-center justify-end text-xs text-green-600">
            <CreditCard size={12} className="mr-1" />
            <span>Commission earned</span>
          </div>
          <p className="text-xs text-gray-500">
            {((value / row.withdrawalAmount) * 100).toFixed(1)}% of withdrawal
          </p>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Transaction Date',
      render: (value: string, row: any) => {
        const date = new Date(value);
        const createdAt = row.createdAt ? new Date(row.createdAt) : date;
        return (
          <div className="space-y-1">
            <p className="font-medium text-gray-800">{date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</p>
            <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { 
              weekday: 'long'
            })}</p>
            <p className="text-xs text-gray-400">{createdAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          <CreditCard size={12} className="mr-1" />
          {value}
        </span>
      )
    },
    {
      key: 'bankDetails',
      header: 'Commission Deposited To',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-xs">
          <div className="flex items-center justify-center mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Building size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-blue-700 font-semibold">Bank Name</p>
              <p className="text-blue-900 font-medium">ADCB (Abu Dhabi Commercial Bank)</p>
            </div>
            <div>
              <p className="text-blue-700 font-semibold">Account Number</p>
              <p className="text-blue-900 font-mono">13*********0001</p>
            </div>
            <div>
              <p className="text-blue-700 font-semibold">IBAN</p>
              <p className="text-blue-900 font-mono text-xs">AE68003001*********0001</p>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <p className="text-blue-600 font-medium text-center">
                Commission: ${row.commissionAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const exportCommissions = () => {
    const csvContent = [
      ['Date', 'Investor Name', 'Investor ID', 'Withdrawal Amount', 'Commission Rate', 'Commission Amount', 'Status'],
      ...filteredCommissions.map(commission => [
        commission.date,
        commission.investorName,
        commission.investorId,
        commission.withdrawalAmount.toString(),
        `${commission.commissionRate}%`,
        commission.commissionAmount.toString(),
        commission.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <DashboardLayout title="Commission Management">
        <Card title="Error">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Commission Management">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Commission Tracking</h2>
          <p className="text-gray-600">Monitor and track 15% commissions earned from investor withdrawals</p>
        </div>
        
        {/* Withdrawal Button */}
        <Button
          variant="primary"
          onClick={() => setWithdrawalModalOpen(true)}
          disabled={totalCommissions < 100}
          className="shadow-lg"
        >
          <Banknote size={18} className="mr-2" />
          Withdraw Earnings
        </Button>
      </div>

      {/* Commission Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3">
            <Wallet className="text-green-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Total Commissions</h3>
          <p className="text-3xl font-bold text-green-600">${totalCommissions.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">All time earnings</p>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Today's Commissions</h3>
          <p className="text-3xl font-bold text-blue-600">${todayCommissions.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Earned today</p>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3">
            <TrendingUp className="text-purple-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">This Month</h3>
          <p className="text-3xl font-bold text-purple-600">${thisMonthCommissions.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Monthly earnings</p>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-3">
            <DollarSign className="text-amber-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Average Commission</h3>
          <p className="text-3xl font-bold text-amber-600">${averageCommission.toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">Per withdrawal</p>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by period:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'year', label: 'This Year' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterPeriod(filter.key as FilterPeriod)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterPeriod === filter.key
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by investor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={exportCommissions}
              disabled={filteredCommissions.length === 0}
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        {filterPeriod !== 'all' && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-purple-600 font-medium">Filtered Results</p>
                <p className="text-purple-800">{filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-purple-600 font-medium">Total Commissions</p>
                <p className="text-purple-800 font-semibold">${filteredTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-purple-600 font-medium">Total Withdrawals</p>
                <p className="text-purple-800 font-semibold">${filteredWithdrawalTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Commission History Table */}
      <Card title={`Commission History (${filteredCommissions.length})`}>
        {filteredCommissions.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Commission Records Found</h3>
            <p className="text-gray-600 mb-6">
              Commission records will appear here when investors make withdrawals.
              Each withdrawal generates a 15% commission automatically.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-blue-800 text-sm">
                <strong>How it works:</strong> When an investor withdrawal is approved, 
                a 15% commission is automatically calculated and recorded here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Table 
              columns={columns} 
              data={filteredCommissions}
              isLoading={loading}
              emptyMessage="No commission records found"
            />

            {!loading && filteredCommissions.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Commission Records</p>
                    <p className="font-bold text-gray-800 text-lg">{filteredCommissions.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Total Withdrawals</p>
                    <p className="font-bold text-blue-600 text-lg">${filteredWithdrawalTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Total Commissions</p>
                    <p className="font-bold text-green-600 text-lg">${filteredTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Commission Rate</p>
                    <p className="font-bold text-purple-600 text-lg">15%</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Commission Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Commission Insights">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Commission Rate</span>
              <span className="font-bold text-purple-600">15%</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-bold text-blue-600">{commissions.length}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Average per Transaction</span>
              <span className="font-bold text-green-600">${averageCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium">Total Earned</span>
              <span className="font-bold text-indigo-600 text-lg">${totalCommissions.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card title="Bank Account Information">
          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-blue-800 font-semibold text-lg">Commission Deposit Account</h3>
                  <p className="text-blue-700 text-sm">All commissions are deposited to this account</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="text-blue-600" size={24} />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-blue-700 font-medium">Bank Name</p>
                  <p className="text-blue-900 font-semibold">ADCB (Abu Dhabi Commercial Bank)</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Bank Account Number</p>
                  <p className="text-blue-900 font-mono">13*********0001</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">IBAN</p>
                  <p className="text-blue-900 font-mono">AE68003001*********0001</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 font-medium">Available for Withdrawal</p>
                  <p className="text-green-900 text-2xl font-bold">${totalCommissions.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-green-600" size={20} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Commission Withdrawal Modal */}
      <CommissionWithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        totalCommissions={totalCommissions}
        onSuccess={() => {
          setWithdrawalModalOpen(false);
          // Optionally refresh commission data
        }}
      />
    </DashboardLayout>
  );
};

export default CommissionsPage;