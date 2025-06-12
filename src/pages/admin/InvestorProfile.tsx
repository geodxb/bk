import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EditableInvestorProfile from '../../components/admin/EditableInvestorProfile';
import WalletOverview from '../../components/investor/WalletOverview';
import PerformanceChart from '../../components/common/PerformanceChart';
import TransactionsTable from '../../components/investor/TransactionsTable';
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
          <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium uppercase tracking-wide">Loading investor profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !investorData) {
    return (
      <DashboardLayout title="Investor Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide">
            {error ? 'Error Loading Investor' : 'Investor Not Found'}
          </h2>
          <p className="text-gray-600 mb-6 uppercase tracking-wide">
            {error || "The investor you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate('/admin')}>
            <ChevronLeft size={18} className="mr-2" />
            Back to Dashboard
          </Button>
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
            {/* Admin Transaction Summary */}
            <Card title="Transaction Overview">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-3">
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">TOTAL TRANSACTIONS</p>
                  </div>
                  <p className="text-gray-900 text-2xl font-bold">{transactions.length}</p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-3">
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">DEPOSITS</p>
                  </div>
                  <p className="text-gray-900 text-2xl font-bold">
                    {transactions.filter(tx => tx.type === 'Deposit').length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-3">
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">EARNINGS</p>
                  </div>
                  <p className="text-gray-900 text-2xl font-bold">
                    {transactions.filter(tx => tx.type === 'Earnings').length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-3">
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">WITHDRAWALS</p>
                  </div>
                  <p className="text-gray-900 text-2xl font-bold">{withdrawalCount}</p>
                </div>
              </div>
            </Card>
            <TransactionsTable investorId={investorData.id} />
          </div>
        );
      case 'withdrawals':
        return (
          <div className="space-y-6">
            {/* Admin Withdrawal Summary */}
            <Card title="Withdrawal Analysis">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 border border-gray-300">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <p className="text-gray-600 font-medium text-sm uppercase tracking-wide">TOTAL WITHDRAWN</p>
                  </div>
                  <div>
                    <p className="text-gray-900 text-3xl font-bold">${totalWithdrawn.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mt-1">Lifetime withdrawals</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 border border-gray-300">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <p className="text-gray-600 font-medium text-sm uppercase tracking-wide">WITHDRAWAL COUNT</p>
                  </div>
                  <div>
                    <p className="text-gray-900 text-3xl font-bold">{withdrawalCount}</p>
                    <p className="text-gray-500 text-sm mt-1">Total requests</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 border border-gray-300">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <p className="text-gray-600 font-medium text-sm uppercase tracking-wide">AVERAGE WITHDRAWAL</p>
                  </div>
                  <div>
                    <p className="text-gray-900 text-3xl font-bold">
                      ${withdrawalCount > 0 ? Math.round(totalWithdrawn / withdrawalCount).toLocaleString() : '0'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">Per transaction</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Admin Commission Information */}
            {withdrawalCount > 0 && (
              <Card title="Commission Information">
                <div className="bg-gray-50 p-6 border border-gray-300">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-gray-800 font-semibold text-lg uppercase tracking-wide">TOTAL COMMISSIONS EARNED</h3>
                  </div>
                  <div>
                    <p className="text-gray-900 text-4xl font-bold mb-2">
                      ${(totalWithdrawn * 0.15).toLocaleString()}
                    </p>
                    <p className="text-gray-700 text-sm mb-4">
                      15% commission on ${totalWithdrawn.toLocaleString()} in withdrawals
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 uppercase tracking-wide">COMMISSION RATE</p>
                        <p className="font-semibold text-gray-800">15%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 uppercase tracking-wide">PER WITHDRAWAL</p>
                        <p className="font-semibold text-gray-800">
                          ${withdrawalCount > 0 ? ((totalWithdrawn * 0.15) / withdrawalCount).toFixed(2) : '0.00'} avg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
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
          <Card title="Performance Analytics">
            <PerformanceChart investorId={investorData.id} />
          </Card>
        );
      default:
        return null;
    }
  };
  
  return (
    <DashboardLayout title={`${investorData.name} - Profile`}>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/investors')}
          className="mb-4"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Investors
        </Button>
        
        {/* Enhanced Header with Industrial Style */}
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 uppercase tracking-wide">{investorData.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 uppercase tracking-wide">
                <span>ID: {investorData.id.slice(-8)}</span>
                <span>•</span>
                <span>{investorData.country}</span>
                <span>•</span>
                <span>Joined: {investorData.joinDate}</span>
                <span>•</span>
                <span className={`font-medium ${
                  investorData.accountStatus?.includes('Active') || !investorData.accountStatus
                    ? 'text-gray-900'
                    : investorData.accountStatus?.includes('Restricted')
                    ? 'text-gray-700'
                    : 'text-gray-700'
                }`}>
                  {investorData.accountStatus || 'Active'}
                </span>
              </div>
              
              {/* Quick Stats for Admin - Industrial Style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-2">
                    <p className="text-gray-600 font-medium uppercase tracking-wide">CURRENT BALANCE</p>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">${investorData.currentBalance.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-2">
                    <p className="text-gray-600 font-medium uppercase tracking-wide">INITIAL DEPOSIT</p>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">${investorData.initialDeposit.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-2">
                    <p className="text-gray-600 font-medium uppercase tracking-wide">TOTAL TRANSACTIONS</p>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">{transactions.length}</p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-300">
                  <div className="border-b border-gray-300 pb-2 mb-2">
                    <p className="text-gray-600 font-medium uppercase tracking-wide">WITHDRAWALS</p>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">{withdrawalCount}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button
                variant="primary"
                onClick={() => setAddCreditModalOpen(true)}
              >
                <PlusCircle size={18} className="mr-2" />
                Add Credit
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Navigation Tabs - Industrial Style */}
      <div className="mb-6 border-b border-gray-300">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors uppercase tracking-wide ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview & Profile
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors uppercase tracking-wide ${
              activeTab === 'transactions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Transactions
            <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wide">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors uppercase tracking-wide ${
              activeTab === 'withdrawals'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Withdrawal History
            <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wide">
              {withdrawalCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors uppercase tracking-wide ${
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