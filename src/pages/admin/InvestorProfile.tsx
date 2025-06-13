import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EditableInvestorProfile from '../../components/admin/EditableInvestorProfile';
import WalletOverview from '../../components/investor/WalletOverview';
import PerformanceChart from '../../components/common/PerformanceChart';
import TransactionsTable from '../../components/investor/TransactionsTable';
import WithdrawalRequestForm from '../../components/investor/WithdrawalRequestForm';
import AddCreditModal from '../../components/admin/AddCreditModal';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useInvestor, useTransactions } from '../../hooks/useFirestore';
import { ChevronLeft, PlusCircle } from 'lucide-react';

const InvestorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addCreditModalOpen, setAddCreditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals' | 'performance'>('overview');
  
  const { investor: investorData, loading, error, refetch } = useInvestor(id || '');
  const { transactions } = useTransactions(id || '');
  
  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading investor profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !investorData) {
    return (
      <DashboardLayout title="Investor Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error ? 'Error Loading Investor' : 'Investor Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The investor you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
          >
            <ChevronLeft size={18} className="mr-2 inline" />
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate withdrawal statistics for admin view
  const withdrawalTransactions = transactions.filter(tx => tx.type === 'Withdrawal');
  const totalWithdrawn = withdrawalTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const withdrawalCount = withdrawalTransactions.length;
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <EditableInvestorProfile investor={investorData} onUpdate={refetch} />
            <WalletOverview
              initialDeposit={investorData.initialDeposit || 0}
              currentBalance={investorData.currentBalance || 0}
            />
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            {/* Refined Transaction Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{transactions.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {transactions.filter(tx => tx.type === 'Deposit').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Deposits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {transactions.filter(tx => tx.type === 'Earnings').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{withdrawalCount}</div>
                    <div className="text-sm text-gray-600 font-medium">Withdrawals</div>
                  </div>
                </div>
              </div>
            </div>
            <TransactionsTable investorId={investorData.id} />
          </div>
        );
      case 'withdrawals':
        return (
          <div className="space-y-6">
            {/* Refined Withdrawal Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Withdrawal Analysis</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${totalWithdrawn.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Total Withdrawn</div>
                    <div className="text-xs text-gray-500 mt-1">Lifetime withdrawals</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{withdrawalCount}</div>
                    <div className="text-sm text-gray-600 font-medium">Withdrawal Count</div>
                    <div className="text-xs text-gray-500 mt-1">Total requests</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${withdrawalCount > 0 ? Math.round(totalWithdrawn / withdrawalCount).toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Average Withdrawal</div>
                    <div className="text-xs text-gray-500 mt-1">Per transaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Request Form - Now with investor prop */}
            <WithdrawalRequestForm
              currentBalance={investorData.currentBalance || 0}
              investorName={investorData.name}
              investor={investorData}
              onSuccess={refetch}
            />

            {/* Refined Commission Information */}
            {withdrawalCount > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Commission Information</h3>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        ${(totalWithdrawn * 0.15).toLocaleString()}
                      </div>
                      <div className="text-lg font-medium text-gray-700 mb-1">Total Commissions Earned</div>
                      <div className="text-sm text-gray-600">
                        15% commission on ${totalWithdrawn.toLocaleString()} in withdrawals
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">15%</div>
                        <div className="text-sm text-gray-600">Commission Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          ${withdrawalCount > 0 ? ((totalWithdrawn * 0.15) / withdrawalCount).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-gray-600">Average per Withdrawal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Withdrawal History */}
            <TransactionsTable 
              investorId={investorData.id}
              filterType="Withdrawal"
            />
          </div>
        );
      case 'performance':
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
            </div>
            <div className="p-6">
              <PerformanceChart investorId={investorData.id} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <DashboardLayout title={`${investorData.name} - Profile`}>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/investors')}
          className="mb-4 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded-lg"
        >
          <ChevronLeft size={16} className="mr-1 inline" />
          Back to Investors
        </button>
        
        {/* Refined Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{investorData.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 font-medium">
                  <span>ID: {investorData.id.slice(-8)}</span>
                  <span>•</span>
                  <span>{investorData.country}</span>
                  <span>•</span>
                  <span>Joined: {investorData.joinDate}</span>
                  <span>•</span>
                  <span className={`font-semibold ${
                    investorData.accountStatus?.includes('Active') || !investorData.accountStatus
                      ? 'text-gray-900'
                      : investorData.accountStatus?.includes('Restricted')
                      ? 'text-gray-700'
                      : 'text-gray-700'
                  }`}>
                    {investorData.accountStatus || 'Active'}
                  </span>
                </div>
                
                {/* Refined Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-600 font-medium mb-1">Current Balance</div>
                    <div className="text-xl font-bold text-gray-900">${investorData.currentBalance.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-600 font-medium mb-1">Initial Deposit</div>
                    <div className="text-xl font-bold text-gray-900">${investorData.initialDeposit.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-600 font-medium mb-1">Total Transactions</div>
                    <div className="text-xl font-bold text-gray-900">{transactions.length}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-gray-600 font-medium mb-1">Withdrawals</div>
                    <div className="text-xl font-bold text-gray-900">{withdrawalCount}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => setAddCreditModalOpen(true)}
                  className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
                >
                  <PlusCircle size={18} className="mr-2 inline" />
                  Add Credit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Refined Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview & Profile
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Transactions
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'withdrawals'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Withdrawal Management
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {withdrawalCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'performance'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
      
      {/* Add Credit Modal */}
      <AddCreditModal
        isOpen={addCreditModalOpen}
        onClose={() => setAddCreditModalOpen(false)}
        investorId={investorData.id}
        investorName={investorData.name}
        currentBalance={investorData.currentBalance || 0}
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
};

export default InvestorProfile;