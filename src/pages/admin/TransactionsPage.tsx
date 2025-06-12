import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useTransactions, useInvestors } from '../../hooks/useFirestore';
import { 
  Filter,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  LogIn,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';

type FilterType = 'all' | 'Deposit' | 'Earnings' | 'Withdrawal';
type FilterStatus = 'all' | 'Completed' | 'Pending' | 'Rejected';

const TransactionsPage = () => {
  const { transactions, loading, error } = useTransactions();
  const { investors } = useInvestors();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Get investor name by ID
  const getInvestorName = (investorId: string) => {
    const investor = investors.find(inv => inv.id === investorId);
    return investor?.name || 'Unknown Investor';
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    const investorName = getInvestorName(transaction.investorId);
    const matchesSearch = investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    return matchesType && matchesStatus && matchesSearch && matchesDate;
  });

  // Calculate statistics
  const totalTransactions = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalDeposits = filteredTransactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
  const totalWithdrawals = Math.abs(filteredTransactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
  const totalEarnings = filteredTransactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Investor', 'Type', 'Amount', 'Status', 'Description'],
      ...filteredTransactions.map(tx => [
        tx.date,
        getInvestorName(tx.investorId),
        tx.type,
        tx.amount.toString(),
        tx.status,
        tx.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</p>
            <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { 
              weekday: 'short'
            })}</p>
          </div>
        );
      }
    },
    {
      key: 'investorId',
      header: 'Investor',
      render: (value: string) => {
        const investorName = getInvestorName(value);
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={14} className="text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{investorName}</p>
              <p className="text-xs text-gray-500">ID: {value.slice(-8)}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      header: 'Type',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {value === 'Deposit' && <LogIn size={16} className="text-blue-600" />}
          {value === 'Earnings' && <TrendingUp size={16} className="text-green-600" />}
          {value === 'Withdrawal' && <ArrowDownRight size={16} className="text-red-600" />}
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right">
          <p className={`font-semibold text-lg ${
            row.type === 'Withdrawal' ? 'text-red-600' : 
            row.type === 'Earnings' ? 'text-green-600' : 
            'text-blue-600'
          }`}>
            {row.type === 'Withdrawal' ? '-' : '+'}${Math.abs(value).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => {
        let statusClass = 'bg-gray-100 text-gray-800';
        let icon = <CheckCircle size={12} />;
        
        if (value === 'Pending') {
          statusClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
          icon = <Clock size={12} />;
        } else if (value === 'Rejected') {
          statusClass = 'bg-red-50 text-red-800 border border-red-200';
          icon = <XCircle size={12} />;
        } else {
          statusClass = 'bg-green-50 text-green-800 border border-green-200';
        }
        
        return (
          <span className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium w-fit ${statusClass}`}>
            {icon}
            <span>{value}</span>
          </span>
        );
      }
    },
    {
      key: 'description',
      header: 'Description',
      render: (value: string, row: any) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">
            {value || `${row.type} transaction`}
          </p>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Transaction History">
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
    <DashboardLayout title="Transaction History">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{totalTransactions}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600 mb-1">${totalDeposits.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Deposits</div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600 mb-1">${totalEarnings.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600 mb-1">${totalWithdrawals.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Withdrawals</div>
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6 bg-white border border-gray-200">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">Type:</span>
              </div>
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'Deposit', label: 'Deposits' },
                  { key: 'Earnings', label: 'Earnings' },
                  { key: 'Withdrawal', label: 'Withdrawals' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterType(filter.key as FilterType)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      filterType === filter.key
                        ? 'bg-blue-600 text-white'
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
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              <button
                onClick={exportTransactions}
                disabled={filteredTransactions.length === 0}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} className="mr-1 inline" />
                Export
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Status:</span>
            </div>
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'Completed', label: 'Completed' },
                { key: 'Pending', label: 'Pending' },
                { key: 'Rejected', label: 'Rejected' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key as FilterStatus)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    filterStatus === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card title={`Transaction History (${filteredTransactions.length})`} className="bg-white border border-gray-200">
        <Table 
          columns={columns} 
          data={filteredTransactions}
          isLoading={loading}
          emptyMessage="No transactions found"
        />

        {!loading && filteredTransactions.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Filtered Results</p>
                <p className="font-medium text-gray-900">{filteredTransactions.length} transactions</p>
              </div>
              <div>
                <p className="text-gray-500">Total Volume</p>
                <p className="font-medium text-gray-900">${totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Average Transaction</p>
                <p className="font-medium text-gray-900">
                  ${filteredTransactions.length > 0 ? (totalAmount / filteredTransactions.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Date Range</p>
                <p className="font-medium text-gray-900">
                  {filteredTransactions.length > 0 ? 
                    `${Math.floor((new Date().getTime() - new Date(Math.min(...filteredTransactions.map(tx => new Date(tx.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default TransactionsPage;