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
  const pageSize = 15;
  
  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedTransactions = transactions.slice(startIndex, endIndex);
  
  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (value: string) => (
        <div className="flex items-center space-x-3">
          {value === 'Deposit' && (
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <LogIn size={12} className="text-gray-600" />
            </div>
          )}
          {value === 'Earnings' && (
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={12} className="text-gray-600" />
            </div>
          )}
          {value === 'Withdrawal' && (
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <ArrowDownRight size={12} className="text-gray-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium">
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
      header: 'Date',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">{date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</p>
            <p className="text-xs text-gray-500 font-medium">{date.toLocaleDateString('en-US', { 
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
          <div className="text-lg font-bold text-gray-900">
            {row.type === 'Withdrawal' ? '-' : '+'}${Math.abs(value).toLocaleString()}
          </div>
          <div className="text-xs px-2 py-1 rounded-full inline-block bg-gray-100 text-gray-700 font-medium">
            {row.type === 'Withdrawal' ? 'Debited' : 'Credited'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string, row: any) => {
        let statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        let icon = <CheckCircle size={12} />;
        
        if (value === 'Pending') {
          statusClass = 'bg-gray-50 text-gray-700 border border-gray-200';
          icon = <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>;
        } else if (value === 'Rejected') {
          statusClass = 'bg-gray-50 text-gray-700 border border-gray-200';
          icon = <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
        } else {
          statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        }
        
        return (
          <div className="space-y-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold w-fit ${statusClass}`}>
              {icon}
              <span>{value}</span>
            </div>
            {row.type === 'Withdrawal' && value === 'Completed' && (
              <div className="flex items-center space-x-1 text-xs text-gray-600 font-medium">
                <CheckCircle size={10} />
                <span>Processed</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Details',
      render: (value: string, row: any) => (
        <div className="space-y-1 max-w-xs">
          <p className="text-sm text-gray-900 font-medium">
            {value || `${row.type} transaction`}
          </p>
          {row.type === 'Withdrawal' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-medium">
                Request #{row.date.replace(/-/g, '')}
              </p>
              <p className="text-xs text-gray-500">
                Bank transfer
              </p>
            </div>
          )}
          {row.type === 'Deposit' && (
            <p className="text-xs text-gray-500">
              Account credit
            </p>
          )}
          {row.type === 'Earnings' && (
            <p className="text-xs text-gray-500">
              Trading activity
            </p>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {filterType ? `${filterType} History` : "Transaction History"}
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          {filterType ? `${filterType} History` : "Transaction History"}
        </h3>
      </div>

      {/* Summary Stats */}
      {!filterType && transactions.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Deposits</p>
                  <p className="text-gray-900 text-xl font-bold">
                    ${transactions
                      .filter(tx => tx.type === 'Deposit')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 font-medium">
                    {transactions.filter(tx => tx.type === 'Deposit').length} transaction(s)
                  </p>
                </div>
                <LogIn className="text-gray-600" size={20} />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
                  <p className="text-gray-900 text-xl font-bold">
                    ${transactions
                      .filter(tx => tx.type === 'Earnings')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 font-medium">
                    {transactions.filter(tx => tx.type === 'Earnings').length} transaction(s)
                  </p>
                </div>
                <TrendingUp className="text-gray-600" size={20} />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Withdrawals</p>
                  <p className="text-gray-900 text-xl font-bold">
                    ${transactions
                      .filter(tx => tx.type === 'Withdrawal')
                      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 font-medium">
                    {transactions.filter(tx => tx.type === 'Withdrawal').length} withdrawal(s)
                  </p>
                </div>
                <ArrowDownRight className="text-gray-600" size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Withdrawal History Section */}
      {filterType === 'Withdrawal' && (
        <div className="p-6 border-b border-gray-100">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <ArrowDownRight size={18} className="mr-2" />
              Withdrawal History
            </h4>
            <p className="text-gray-700 text-sm font-medium">
              Complete record of all withdrawal transactions processed for this account.
              Each withdrawal has been successfully transferred to the registered bank account.
            </p>
          </div>
        </div>
      )}
      
      <div className="overflow-hidden">
        <Table 
          columns={columns} 
          data={displayedTransactions}
          isLoading={loading}
          emptyMessage={`No ${filterType ? filterType.toLowerCase() : 'transaction'} history to display`}
        />
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-6 bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <p className="font-semibold">
              Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Page {page} of {totalPages}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              Previous
            </button>
            
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
                    className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                      page === pageNum
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
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
              className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                page === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Transaction Guide */}
      {!loading && transactions.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3">Transaction Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <LogIn size={12} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Deposits</p>
                <p className="text-sm text-gray-600">Funds added to your trading account</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp size={12} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Earnings</p>
                <p className="text-sm text-gray-600">Profits generated from trading activities</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowDownRight size={12} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Withdrawals</p>
                <p className="text-sm text-gray-600">Funds withdrawn to your bank account</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;