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
          <p className="text-gray-600 font-medium uppercase tracking-wide">LOADING INVESTOR PROFILE...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !investorData) {
    return (
      <DashboardLayout title="Investor Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide">
            {error ? 'ERROR LOADING INVESTOR' : 'INVESTOR NOT FOUND'}
          </h2>
          <p className="text-gray-600 mb-6 uppercase tracking-wide">
            {error || "THE INVESTOR YOU'RE LOOKING FOR DOESN'T EXIST OR HAS BEEN REMOVED."}
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-800 text-white font-medium uppercase tracking-wide hover:bg-gray-900 transition-colors"
          >
            <ChevronLeft size={18} className="mr-2 inline" />
            BACK TO DASHBOARD
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
            {/* Industrial Transaction Summary */}
            <div className="bg-white border border-gray-400">
              <div className="px-6 py-4 border-b border-gray-400 bg-gray-100">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">TRANSACTION OVERVIEW</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gray-100 p-4 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-3">
                      <p className="text-gray-700 text-xs uppercase tracking-wider font-bold">TOTAL TRANSACTIONS</p>
                    </div>
                    <p className="text-gray-900 text-2xl font-bold">{transactions.length}</p>
                  </div>
                  <div className="bg-gray-100 p-4 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-3">
                      <p className="text-gray-700 text-xs uppercase tracking-wider font-bold">DEPOSITS</p>
                    </div>
                    <p className="text-gray-900 text-2xl font-bold">
                      {transactions.filter(tx => tx.type === 'Deposit').length}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-4 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-3">
                      <p className="text-gray-700 text-xs uppercase tracking-wider font-bold">EARNINGS</p>
                    </div>
                    <p className="text-gray-900 text-2xl font-bold">
                      {transactions.filter(tx => tx.type === 'Earnings').length}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-4 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-3">
                      <p className="text-gray-700 text-xs uppercase tracking-wider font-bold">WITHDRAWALS</p>
                    </div>
                    <p className="text-gray-900 text-2xl font-bold">{withdrawalCount}</p>
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
            {/* Industrial Withdrawal Summary */}
            <div className="bg-white border border-gray-400">
              <div className="px-6 py-4 border-b border-gray-400 bg-gray-100">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">WITHDRAWAL ANALYSIS</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-100 p-6 border border-gray-400">
                    <div className="border-b border-gray-400 pb-3 mb-4">
                      <p className="text-gray-700 font-bold text-xs uppercase tracking-wider">TOTAL WITHDRAWN</p>
                    </div>
                    <div>
                      <p className="text-gray-900 text-3xl font-bold">${totalWithdrawn.toLocaleString()}</p>
                      <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">LIFETIME WITHDRAWALS</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-6 border border-gray-400">
                    <div className="border-b border-gray-400 pb-3 mb-4">
                      <p className="text-gray-700 font-bold text-xs uppercase tracking-wider">WITHDRAWAL COUNT</p>
                    </div>
                    <div>
                      <p className="text-gray-900 text-3xl font-bold">{withdrawalCount}</p>
                      <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">TOTAL REQUESTS</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-6 border border-gray-400">
                    <div className="border-b border-gray-400 pb-3 mb-4">
                      <p className="text-gray-700 font-bold text-xs uppercase tracking-wider">AVERAGE WITHDRAWAL</p>
                    </div>
                    <div>
                      <p className="text-gray-900 text-3xl font-bold">
                        ${withdrawalCount > 0 ? Math.round(totalWithdrawn / withdrawalCount).toLocaleString() : '0'}
                      </p>
                      <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">PER TRANSACTION</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Industrial Commission Information */}
            {withdrawalCount > 0 && (
              <div className="bg-white border border-gray-400">
                <div className="px-6 py-4 border-b border-gray-400 bg-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">COMMISSION INFORMATION</h3>
                </div>
                <div className="p-6">
                  <div className="bg-gray-100 p-6 border border-gray-400">
                    <div className="border-b border-gray-400 pb-3 mb-4">
                      <h3 className="text-gray-800 font-bold text-lg uppercase tracking-wider">TOTAL COMMISSIONS EARNED</h3>
                    </div>
                    <div>
                      <p className="text-gray-900 text-4xl font-bold mb-2">
                        ${(totalWithdrawn * 0.15).toLocaleString()}
                      </p>
                      <p className="text-gray-700 text-sm mb-4 uppercase tracking-wide">
                        15% COMMISSION ON ${totalWithdrawn.toLocaleString()} IN WITHDRAWALS
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 uppercase tracking-wider font-bold">COMMISSION RATE</p>
                          <p className="font-bold text-gray-800">15%</p>
                        </div>
                        <div>
                          <p className="text-gray-600 uppercase tracking-wider font-bold">PER WITHDRAWAL</p>
                          <p className="font-bold text-gray-800">
                            ${withdrawalCount > 0 ? ((totalWithdrawn * 0.15) / withdrawalCount).toFixed(2) : '0.00'} AVG
                          </p>
                        </div>
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
          <div className="bg-white border border-gray-400">
            <div className="px-6 py-4 border-b border-gray-400 bg-gray-100">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">PERFORMANCE ANALYTICS</h3>
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
          className="mb-4 px-3 py-2 bg-white border border-gray-400 text-gray-700 text-sm font-medium uppercase tracking-wide hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1 inline" />
          BACK TO INVESTORS
        </button>
        
        {/* Industrial Header */}
        <div className="bg-white border border-gray-400">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wider">{investorData.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 uppercase tracking-wider font-medium">
                  <span>ID: {investorData.id.slice(-8)}</span>
                  <span>•</span>
                  <span>{investorData.country}</span>
                  <span>•</span>
                  <span>JOINED: {investorData.joinDate}</span>
                  <span>•</span>
                  <span className="font-bold text-gray-900">
                    {investorData.accountStatus || 'ACTIVE'}
                  </span>
                </div>
                
                {/* Industrial Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-100 p-3 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-2">
                      <p className="text-gray-700 font-bold uppercase tracking-wider text-xs">CURRENT BALANCE</p>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">${investorData.currentBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-100 p-3 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-2">
                      <p className="text-gray-700 font-bold uppercase tracking-wider text-xs">INITIAL DEPOSIT</p>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">${investorData.initialDeposit.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-100 p-3 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-2">
                      <p className="text-gray-700 font-bold uppercase tracking-wider text-xs">TOTAL TRANSACTIONS</p>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{transactions.length}</p>
                  </div>
                  <div className="bg-gray-100 p-3 border border-gray-400">
                    <div className="border-b border-gray-400 pb-2 mb-2">
                      <p className="text-gray-700 font-bold uppercase tracking-wider text-xs">WITHDRAWALS</p>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{withdrawalCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => setAddCreditModalOpen(true)}
                  className="px-4 py-2 bg-gray-800 text-white font-medium uppercase tracking-wide hover:bg-gray-900 transition-colors"
                >
                  <PlusCircle size={18} className="mr-2 inline" />
                  ADD CREDIT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Industrial Navigation Tabs */}
      <div className="mb-6 border-b border-gray-400">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 border-b-2 font-bold text-sm transition-colors uppercase tracking-wider ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            OVERVIEW & PROFILE
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 border-b-2 font-bold text-sm transition-colors uppercase tracking-wider ${
              activeTab === 'transactions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            ALL TRANSACTIONS
            <span className="ml-2 px-2 py-1 bg-gray-300 text-gray-900 text-xs font-bold uppercase tracking-wider border border-gray-400">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-2 border-b-2 font-bold text-sm transition-colors uppercase tracking-wider ${
              activeTab === 'withdrawals'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            WITHDRAWAL HISTORY
            <span className="ml-2 px-2 py-1 bg-gray-300 text-gray-900 text-xs font-bold uppercase tracking-wider border border-gray-400">
              {withdrawalCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-2 border-b-2 font-bold text-sm transition-colors uppercase tracking-wider ${
              activeTab === 'performance'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            PERFORMANCE
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