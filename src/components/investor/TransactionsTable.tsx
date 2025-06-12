import { useState } from 'react';
import Card from '../common/Card';
import Table from '../common/Table';
import { TrendingUp, TrendingDown, LogIn, ArrowDownRight, CheckCircle } from 'lucide-react';
import { useTransactions } from '../../hooks/useFirestore';

interface TransactionsTableProps {
  investorId: string;
  filterType?: 'Deposit' | 'Earnings' | 'Withdrawal';
}

const TransactionsTable = ({ investorId, filterType }: TransactionsTableProps) => {
  const { transactions: allTransactions, loading, error } = useTransactions(investorId);
  const transactions = filterType 
    ? allTransactions.filter(tx => tx.type === filterType)
    : allTransactions;
    
  const [page, setPage] = useState(1);
  const pageSize = 15; // Show more transactions per page
  
  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedTransactions = transactions.slice(startIndex, endIndex);
  
  const columns = [
    {
      key: 'type',
      header: 'Transaction Type',
      render: (value: string) => (
        <div className="flex items-center space-x-3">
          {value === 'Deposit' && (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <LogIn size={16} className="text-blue-600" />
            </div>
          )}
          {value === 'Earnings' && (
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          )}
          {value === 'Withdrawal' && (
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowDownRight size={16} className="text-red-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">
              {value === 'Deposit' && 'Funds added'}
              {value === 'Earnings' && 'Trading profit'}
              {value === 'Withdrawal' && 'Funds withdrawn'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & Time',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="space-y-1">
            <p className="font-semibold text-gray-800">{date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</p>
            <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { 
              weekday: 'long'
            })}</p>
            <p className="text-xs text-gray-400">{date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right space-y-1">
          <div className={`text-xl font-bold ${
            row.type === 'Withdrawal' ? 'text-red-600' : 
            row.type === 'Earnings' ? 'text-green-600' : 
            'text-blue-600'
          }`}>
            {row.type === 'Withdrawal' ? '-' : '+'}${Math.abs(value).toLocaleString()}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
            row.type === 'Withdrawal' ? 'bg-red-100 text-red-700' : 
            row.type === 'Earnings' ? 'bg-green-100 text-green-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {row.type === 'Withdrawal' ? 'Debited' : 'Credited'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string, row: any) => {
        let bgColor = 'bg-green-100';
        let textColor = 'text-green-800';
        let icon = <CheckCircle size={14} />;
        
        if (value === 'Pending') {
          bgColor = 'bg-amber-100';
          textColor = 'text-amber-800';
          icon = <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>;
        } else if (value === 'Rejected') {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          icon = <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
        }
        
        return (
          <div className="space-y-2">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${bgColor} ${textColor} font-medium text-sm w-fit`}>
              {icon}
              <span>{value}</span>
            </div>
            {row.type === 'Withdrawal' && value === 'Completed' && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <CheckCircle size={12} />
                <span>Successfully processed</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Transaction Details',
      render: (value: string, row: any) => (
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-medium text-gray-800">
            {value || `${row.type} transaction`}
          </p>
          {row.type === 'Withdrawal' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                Withdrawal Request #{row.date.replace(/-/g, '')}
              </p>
              <p className="text-xs text-gray-500">
                Processed via bank transfer
              </p>
            </div>
          )}
          {row.type === 'Deposit' && (
            <p className="text-xs text-gray-500">
              Credited by in-app bank balance
            </p>
          )}
          {row.type === 'Earnings' && (
            <p className="text-xs text-gray-500">
              Generated from trading activities
            </p>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <Card title={filterType ? `${filterType} History` : "Complete Transaction History"} className="h-full">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title={filterType ? `${filterType} History` : "Complete Transaction History"} className="h-full">
      {/* Enhanced Summary Stats */}
      {!filterType && transactions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 font-semibold text-sm">Total Deposits</p>
                  <p className="text-blue-900 text-2xl font-bold">
                    ${transactions
                      .filter(tx => tx.type === 'Deposit')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    {transactions.filter(tx => tx.type === 'Deposit').length} transaction(s)
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <LogIn className="text-blue-700" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 font-semibold text-sm">Total Earnings</p>
                  <p className="text-green-900 text-2xl font-bold">
                    ${transactions
                      .filter(tx => tx.type === 'Earnings')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    {transactions.filter(tx => tx.type === 'Earnings').length} transaction(s)
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-700" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 font-semibold text-sm">Total Withdrawals</p>
                  <p className="text-red-900 text-2xl font-bold">
                    ${transactions
                      .filter(tx => tx.type === 'Withdrawal')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    {transactions.filter(tx => tx.type === 'Withdrawal').length} withdrawal(s)
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                  <ArrowDownRight className="text-red-700" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Withdrawal History Section */}
      {filterType === 'Withdrawal' && (
        <div className="mb-6 p-6 bg-red-50 rounded-xl border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
            <ArrowDownRight size={20} className="mr-2" />
            Withdrawal History
          </h3>
          <p className="text-red-700 text-sm">
            Complete record of all withdrawal transactions processed for this account.
            Each withdrawal has been successfully transferred to the registered bank account.
          </p>
        </div>
      )}
      
      <Table 
        columns={columns} 
        data={displayedTransactions}
        isLoading={loading}
        emptyMessage={`No ${filterType ? filterType.toLowerCase() : 'transaction'} history to display`}
      />
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="text-sm text-gray-600">
            <p className="font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Page {page} of {totalPages}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg border transition-colors font-medium ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
              }`}
            >
              Previous
            </button>
            
            {/* Enhanced Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg border transition-colors font-medium ${
                      page === pageNum
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-lg border transition-colors font-medium ${
                page === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Enhanced Transaction Type Legend */}
      {!loading && transactions.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Transaction Guide
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <LogIn size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Deposits</p>
                <p className="text-sm text-gray-600">Funds added to your trading account</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Earnings</p>
                <p className="text-sm text-gray-600">Profits generated from trading activities</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowDownRight size={16} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Withdrawals</p>
                <p className="text-sm text-gray-600">Funds withdrawn to your bank account</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TransactionsTable;