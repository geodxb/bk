import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WalletOverview from '../../components/investor/WalletOverview';
import PerformanceChart from '../../components/common/PerformanceChart';
import TransactionsTable from '../../components/investor/TransactionsTable';
import WithdrawModal from '../../components/investor/WithdrawModal';
import AlertBanner from '../../components/investor/AlertBanner';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestor, useTransactions } from '../../hooks/useFirestore';
import { DollarSign, TrendingUp, Clock, User } from 'lucide-react';

type TabType = 'performance' | 'transactions' | 'withdrawals' | 'profile';

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  
  // Get investor data and transactions from Firebase
  const { investor: investorData, refetch: refetchInvestor } = useInvestor(user?.id || '');
  const { transactions } = useTransactions(user?.id);
  
  // Use fallback data if Firebase data is not available
  const currentInvestor = investorData || {
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    country: 'Unknown',
    joinDate: new Date().toISOString().split('T')[0],
    initialDeposit: 0,
    currentBalance: 0,
    profilePic: user?.profilePic || '',
    role: 'investor' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Account flags from Firebase
    accountFlags: investorData?.accountFlags || {},
    accountStatus: investorData?.accountStatus || 'Active'
  };
  
  // Calculate performance metrics
  const totalEarnings = transactions
    .filter(tx => tx.type === 'Earnings')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalDeposits = transactions
    .filter(tx => tx.type === 'Deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));

  // Determine which alerts to show based on Firebase flags and account status
  const getActiveAlerts = () => {
    const alerts = [];
    
    // Check for policy violation
    if (currentInvestor.accountFlags?.policyViolation || 
        currentInvestor.accountStatus?.includes('policy violation') ||
        currentInvestor.accountStatus?.includes('Restricted')) {
      alerts.push({
        type: 'policy-violation' as const,
        id: 'policy-violation',
        message: currentInvestor.accountFlags?.policyViolationMessage || 
                'Your account has been restricted due to a policy violation. Withdrawals are temporarily disabled.'
      });
    }
    
    // Check for pending KYC
    if (currentInvestor.accountFlags?.pendingKyc || 
        currentInvestor.accountStatus?.includes('KYC')) {
      alerts.push({
        type: 'pending-kyc' as const,
        id: 'pending-kyc',
        message: currentInvestor.accountFlags?.kycMessage || 
                'Please complete your KYC verification to continue using all account features.'
      });
    }
    
    // Check for withdrawal disabled
    if (currentInvestor.accountFlags?.withdrawalDisabled || 
        currentInvestor.accountStatus?.includes('withdrawal')) {
      alerts.push({
        type: 'withdrawal-disabled' as const,
        id: 'withdrawal-disabled',
        message: currentInvestor.accountFlags?.withdrawalMessage || 
                'Withdrawal functionality is temporarily disabled. Please contact support for assistance.'
      });
    }
    
    // Filter out dismissed alerts
    return alerts.filter(alert => !dismissedAlerts.includes(alert.id));
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Earnings</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${totalEarnings.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Deposits</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${totalDeposits.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">ROI</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {totalDeposits > 0 ? ((totalEarnings / totalDeposits) * 100).toFixed(2) : '0.00'}%
                </p>
              </Card>
            </div>
            <Card title="Performance Chart">
              <PerformanceChart investorId={currentInvestor.id} />
            </Card>
          </div>
        );
        
      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions.length}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Largest Transaction</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${transactions.length > 0 ? Math.max(...transactions.map(t => Math.abs(t.amount))).toLocaleString() : '0'}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Average Transaction</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  ${transactions.length > 0 ? (transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length).toFixed(2) : '0.00'}
                </p>
              </Card>
            </div>
            <TransactionsTable investorId={currentInvestor.id} />
          </div>
        );
        
      case 'withdrawals':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Available Balance</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${currentInvestor.currentBalance.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Withdrawn</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${totalWithdrawals.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={currentInvestor.accountFlags?.withdrawalDisabled || 
                           currentInvestor.accountStatus?.includes('Restricted')}
                >
                  <DollarSign size={18} className="mr-2" />
                  {currentInvestor.accountFlags?.withdrawalDisabled || 
                   currentInvestor.accountStatus?.includes('Restricted') 
                    ? 'Withdrawals Disabled' 
                    : 'Request Withdrawal'}
                </Button>
              </Card>
            </div>
            <Card title="Withdrawal History">
              <TransactionsTable 
                investorId={currentInvestor.id}
                filterType="Withdrawal"
              />
            </Card>
          </div>
        );
        
      case 'profile':
        return (
          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{currentInvestor.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Country</p>
                      <p className="text-gray-800">{currentInvestor.country}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Member Since</p>
                      <p className="text-gray-800">{currentInvestor.joinDate}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Status</p>
                      <p className={`font-medium ${
                        currentInvestor.accountStatus?.includes('Active') || !currentInvestor.accountStatus
                          ? 'text-green-600'
                          : currentInvestor.accountStatus?.includes('Restricted')
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {currentInvestor.accountStatus || 'Active'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Type</p>
                      <p className="text-gray-800">Investor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
    }
  };

  const activeAlerts = getActiveAlerts();

  return (
    <DashboardLayout title="Investor Dashboard">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-800">Welcome back, {user?.name || 'Investor'}</h2>
        <p className="text-gray-600">Here's an overview of your trading account.</p>
      </div>
      
      {/* Alert Banners */}
      {activeAlerts.map((alert) => (
        <AlertBanner
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onDismiss={() => handleDismissAlert(alert.id)}
        />
      ))}
      
      <div className="mb-6">
        <WalletOverview
          initialDeposit={currentInvestor.initialDeposit}
          currentBalance={currentInvestor.currentBalance}
        />
      </div>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'performance'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={18} className="mr-2" />
            Performance
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'transactions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={18} className="mr-2" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'withdrawals'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign size={18} className="mr-2" />
            Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={18} className="mr-2" />
            Profile
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
      
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        currentBalance={currentInvestor.currentBalance}
        onSuccess={refetchInvestor}
      />
    </DashboardLayout>
  );
};

export default InvestorDashboard;