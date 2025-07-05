import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { Investor } from '../../types/user';
import { 
  AlertTriangle, 
  CheckCircle as CheckIcon, 
  DollarSign, 
  Calendar,
  Shield,
  XCircle
} from 'lucide-react';

interface DeleteInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  onSuccess?: () => void;
}

const DeleteInvestorModal = ({ 
  isOpen, 
  onClose, 
  investor,
  onSuccess 
}: DeleteInvestorModalProps) => {
  const { user } = useAuth();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const requiredText = `DELETE ${investor.name.toUpperCase()}`;
  const isConfirmationValid = confirmationText === requiredText;
  
  const handleDelete = async () => {
    if (!isConfirmationValid || !user) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Update investor status to mark for deletion
      await FirestoreService.updateInvestor(investor.id, {
        accountStatus: 'Closed - Account deletion requested',
        isActive: false,
        deletionRequest: {
          requestedBy: user.id,
          requestedAt: new Date(),
          reason: 'Account deletion requested by admin',
          hasBalance: investor.currentBalance > 0,
          balanceAmount: investor.currentBalance
        }
      });
      
      // Add a transaction record for the deletion request
      await FirestoreService.addTransaction({
        investorId: investor.id,
        type: 'Credit',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: `Account deletion requested - ${investor.currentBalance > 0 ? 'Fund transfer initiated' : 'No balance to transfer'}`
      });
      
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting investor:', error);
      setError('Failed to process deletion request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText('');
      setError('');
      setIsSuccess(false);
      onClose();
    }
  };
  
  if (isSuccess) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Account Deletion Submitted"
        size="lg"
      >
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon size={40} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Account Deletion Submitted for Review Successfully
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            This account cannot be operated. User cannot create an account for 90 days.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3">Deletion Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Investor Name</p>
                <p className="font-bold text-blue-900">{investor.name}</p>
              </div>
              <div>
                <p className="text-blue-600">Account Balance</p>
                <p className="font-bold text-blue-900">${investor.currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-600">Status</p>
                <p className="font-bold text-blue-900">Deletion Requested</p>
              </div>
              <div>
                <p className="text-blue-600">Restriction Period</p>
                <p className="font-bold text-blue-900">90 Days</p>
              </div>
            </div>
          </div>
          
          {investor.currentBalance > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
              <div className="flex items-start space-x-3">
                <DollarSign size={20} className="text-amber-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-semibold text-amber-800">Fund Transfer Process</h4>
                  <p className="text-amber-700 text-sm mt-1">
                    The remaining balance of ${investor.currentBalance.toLocaleString()} will be transferred 
                    to the registered bank account within 60-90 days after review approval.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button onClick={handleClose} variant="primary">
            Close
          </Button>
        </div>
      </Modal>
    );
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Investor Account"
      size="lg"
    >
      <div className="space-y-6">
        {/* Warning Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={24} className="text-red-600 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-semibold text-lg">PERMANENT ACCOUNT DELETION</h3>
              <p className="text-red-700 text-sm mt-1">
                This action cannot be undone and will permanently remove all investor data.
              </p>
            </div>
          </div>
        </div>

        {/* Investor Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Account to be Deleted</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-semibold text-gray-900">{investor.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">{investor.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Country</p>
              <p className="font-semibold text-gray-900">{investor.country}</p>
            </div>
            <div>
              <p className="text-gray-600">Current Balance</p>
              <p className="font-semibold text-gray-900">${investor.currentBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {investor.currentBalance > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <DollarSign size={20} className="text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Fund Transfer Required</h4>
                <p className="text-amber-700 text-sm mt-1">
                  This account has a balance of ${investor.currentBalance.toLocaleString()}. 
                  Funds will be transferred to the registered bank account. This closure request 
                  will be reviewed and funds will be deposited within a period of 90 days maximum 
                  (usually within 60 days).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Consequences */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">What happens when you delete this account:</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <XCircle size={16} className="text-red-500 mt-1" />
              <p className="text-gray-700 text-sm">All investor data and transaction history will be permanently removed</p>
            </div>
            <div className="flex items-start space-x-3">
              <XCircle size={16} className="text-red-500 mt-1" />
              <p className="text-gray-700 text-sm">Investor will lose access to their account immediately</p>
            </div>
            <div className="flex items-start space-x-3">
              <Shield size={16} className="text-amber-500 mt-1" />
              <p className="text-gray-700 text-sm">Account creation will be blocked for 90 days</p>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar size={16} className="text-blue-500 mt-1" />
              <p className="text-gray-700 text-sm">Fund transfer process will be initiated (if applicable)</p>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requiredText}</span> to confirm deletion:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder={`Type "${requiredText}" here`}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isLoading}
            isLoading={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing Deletion...' : 'Delete Account Permanently'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteInvestorModal;