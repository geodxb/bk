import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DollarSign, 
  Building, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Edit,
  Banknote
} from 'lucide-react';

interface CommissionWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCommissions: number;
  onSuccess?: () => void;
}

const CommissionWithdrawalModal = ({ 
  isOpen, 
  onClose, 
  totalCommissions,
  onSuccess 
}: CommissionWithdrawalModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('primary');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Primary ADCB account details
  const primaryAccount = {
    id: 'primary',
    bankName: 'ADCB (Abu Dhabi Commercial Bank)',
    accountNumber: '13*********0001',
    iban: 'AE68003001*********0001',
    accountHolder: 'Cristian Rolando Dorao',
    currency: 'AED',
    isVerified: true
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numAmount > totalCommissions) {
      setError('Withdrawal amount cannot exceed available commission balance');
      return false;
    }
    
    if (numAmount < 100) {
      setError('Minimum withdrawal amount is $100');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAmount() || !user) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create commission withdrawal request
      await FirestoreService.addCommissionWithdrawalRequest({
        adminId: user.id,
        adminName: user.name,
        amount: parseFloat(amount),
        accountDetails: selectedAccount === 'primary' ? primaryAccount : null,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      });
      
      setIsLoading(false);
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting commission withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setAmount('');
    setError('');
    setIsSuccess(false);
    setSelectedAccount('primary');
    setShowAddAccount(false);
    onClose();
  };

  const quickAmounts = [1000, 5000, 10000, 25000, 50000];
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Withdraw Commission Earnings"
      size="lg"
    >
      {!isSuccess ? (
        <div className="space-y-6">
          {/* Commission Summary */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-800 font-semibold text-lg mb-2">Available Commission Balance</h3>
                <p className="text-blue-900 text-3xl font-bold mb-2">
                  ${totalCommissions.toLocaleString()}
                </p>
                <p className="text-blue-700 text-sm">
                  Total earned from 15% commission on investor withdrawals
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <DollarSign className="text-blue-700" size={32} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Withdrawal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (USD)
              </label>
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="100"
                  max={totalCommissions}
                  required
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.filter(amount => amount <= totalCommissions).map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200 font-medium"
                  >
                    ${quickAmount.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(totalCommissions.toString())}
                  className="px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200 font-medium"
                >
                  Max: ${totalCommissions.toLocaleString()}
                </button>
              </div>
              
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Bank Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Withdrawal Destination
              </label>
              
              {/* Primary ADCB Account */}
              <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedAccount === 'primary' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="account"
                    value="primary"
                    checked={selectedAccount === 'primary'}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building size={20} className="text-blue-600" />
                      <span className="font-semibold text-gray-800">Primary Account</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Verified
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-gray-800">{primaryAccount.bankName}</p>
                      <p className="text-gray-600">Account: {primaryAccount.accountNumber}</p>
                      <p className="text-gray-600">IBAN: {primaryAccount.iban}</p>
                      <p className="text-gray-600">Holder: {primaryAccount.accountHolder}</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Add New Account Option */}
              <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all mt-3 ${
                selectedAccount === 'new' 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="account"
                    value="new"
                    checked={selectedAccount === 'new'}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Plus size={20} className="text-amber-600" />
                      <span className="font-semibold text-gray-800">Add New Bank Account</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        Requires Approval
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Submit a request to add a new payout method. This requires verification and approval.
                    </p>
                  </div>
                </label>
              </div>

              {selectedAccount === 'new' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-2">Bank Account Change Request</h4>
                      <p className="text-amber-700 text-sm mb-3">
                        To add a new bank account for commission withdrawals, you'll need to submit a request 
                        with the following information:
                      </p>
                      <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside">
                        <li>Bank name and branch details</li>
                        <li>Account number and IBAN</li>
                        <li>Account holder verification documents</li>
                        <li>Reason for account change</li>
                      </ul>
                      <p className="text-amber-700 text-sm mt-3">
                        This process typically takes 3-5 business days for verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <CreditCard size={18} className="mr-2" />
                Processing Information
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Commission withdrawals are processed within 1-3 business days</p>
                <p>• Minimum withdrawal amount: $100</p>
                <p>• No processing fees for primary account withdrawals</p>
                <p>• Funds will be converted to AED at current exchange rate</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={isLoading || selectedAccount === 'new'}
                className="flex-1"
              >
                <Banknote size={18} className="mr-2" />
                {selectedAccount === 'new' ? 'Submit Account Request' : 'Request Withdrawal'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Withdrawal Request Submitted</h3>
          <p className="text-gray-600 mb-6 text-lg">
            Your commission withdrawal request for ${parseFloat(amount).toLocaleString()} has been successfully submitted.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3">Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Amount</p>
                <p className="font-bold text-blue-900">${parseFloat(amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-600">Destination</p>
                <p className="font-bold text-blue-900">ADCB Account</p>
              </div>
              <div>
                <p className="text-blue-600">Processing Time</p>
                <p className="font-bold text-blue-900">1-3 Business Days</p>
              </div>
              <div>
                <p className="text-blue-600">Status</p>
                <p className="font-bold text-blue-900">Pending Review</p>
              </div>
            </div>
          </div>
          
          <Button onClick={handleClose} variant="primary">
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default CommissionWithdrawalModal;