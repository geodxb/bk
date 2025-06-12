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
import { ChevronLeft, PlusCircle, Activity, DollarSign, TrendingUp, ArrowDownRight, Users } from 'lucide-react';

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
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading investor profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !investorData) {
    return (
      <DashboardLayout title="Investor Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error ? 'Error Loading Investor' : 'Investor Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
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
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-700 font-semibold text-sm">Total Transactions</p>
                      <p className="text-blue-900 text-2xl font-bold">{transactions.length}</p>
                    </div>
                    <Activity className="text-blue-600" size={24} />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 font-semibold text-sm">Deposits</p>
                      <p className="text-green-900 text-2xl font-bold">
                        {transactions.filter(tx => tx.type === 'Deposit').length}
                      </p>
                    </div>
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-700 font-semibold text-sm">Earnings</p>
                      <p className="text-amber-900 text-2xl font-bold">
                        {transactions.filter(tx => tx.type === 'Earnings').length}
                      </p>
                    </div>
                    <DollarSign className="text-amber-600" size={24} />
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-700 font-semibold text-sm">Withdrawals</p>
                      <p className="text-red-900 text-2xl font-bold">{withdrawalCount}</p>
                    </div>
                    <ArrowDownRight className="text-red-600" size={24} />
                  </div>
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
                <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-700 font-semibold">Total Withdrawn</p>
                      <p className="text-red-900 text-3xl font-bold">${totalWithdrawn.toLocaleString()}</p>
                      <p className="text-red-600 text-sm mt-1">Lifetime withdrawals</p>
                    </div>
                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="text-red-700" size={28} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-700 font-semibold">Withdrawal Count</p>
                      <p className="text-blue-900 text-3xl font-bold">{withdrawalCount}</p>
                      <p className="text-blue-600 text-sm mt-1">Total requests</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <Users className="text-blue-700" size={28} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-700 font-semibold">Average Withdrawal</p>
                      <p className="text-purple-900 text-3xl font-bold">
                        ${withdrawalCount > 0 ? Math.round(totalWithdrawn / withdrawalCount).toLocaleString() : '0'}
                      </p>
                      <p className="text-purple-600 text-sm mt-1">Per transaction</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                      <DollarSign className="text-purple-700" size={28} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Admin Commission Information */}
            {withdrawalCount > 0 && (
              <Card title="Commission Information">
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-green-800 font-semibold text-lg mb-2">Total Commissions Earned</h3>
                      <p className="text-green-900 text-4xl font-bold mb-2">
                        ${(totalWithdrawn * 0.15).toLocaleString()}
                      </p>
                      <p className="text-green-700 text-sm">
                        15% commission on ${totalWithdrawn.toLocaleString()} in withdrawals
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-green-600">Commission Rate</p>
                          <p className="font-semibold text-green-800">15%</p>
                        </div>
                        <div>
                          <p className="text-green-600">Per Withdrawal</p>
                          <p className="font-semibold text-green-800">
                            ${withdrawalCount > 0 ? ((totalWithdrawn * 0.15) / withdrawalCount).toFixed(2) : '0.00'} avg
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                      <DollarSign className="text-green-700" size={32} />
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
        
        {/* Enhanced Header with Quick Stats */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{investorData.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span>ID: {investorData.id.slice(-8)}</span>
                <span>•</span>
                <span>{investorData.country}</span>
                <span>•</span>
                <span>Joined: {investorData.joinDate}</span>
                <span>•</span>
                <span className={`font-medium ${
                  investorData.accountStatus?.includes('Active') || !investorData.accountStatus
                    ? 'text-green-600'
                    : investorData.accountStatus?.includes('Restricted')
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {investorData.accountStatus || 'Active'}
                </span>
              </div>
              
              {/* Quick Stats for Admin */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-600 font-medium">Current Balance</p>
                  <p className="text-blue-900 font-bold text-lg">${investorData.currentBalance.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-600 font-medium">Initial Deposit</p>
                  <p className="text-green-900 font-bold text-lg">${investorData.initialDeposit.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-purple-600 font-medium">Total Transactions</p>
                  <p className="text-purple-900 font-bold text-lg">{transactions.length}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-600 font-medium">Withdrawals</p>
                  <p className="text-red-900 font-bold text-lg">{withdrawalCount}</p>
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
      
      {/* Enhanced Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 flex items-center border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity size={18} className="mr-2" />
            Overview & Profile
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 flex items-center border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign size={18} className="mr-2" />
            All Transactions
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-2 flex items-center border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'withdrawals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ArrowDownRight size={18} className="mr-2" />
            Withdrawal History
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
              {withdrawalCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-2 flex items-center border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp size={18} className="mr-2" />
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