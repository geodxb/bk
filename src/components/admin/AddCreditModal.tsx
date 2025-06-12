import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  currentBalance: number;
  onSuccess?: () => void;
}

const AddCreditModal = ({ 
  isOpen, 
  onClose, 
  investorId,
  investorName, 
  currentBalance,
  onSuccess 
}: AddCreditModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
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
      await FirestoreService.addCreditToInvestor(
        investorId,
        parseFloat(amount),
        user.id
      );
      
      setIsLoading(false);
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding credit:', error);
      setError('Failed to add credit. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setAmount('');
    setError('');
    setIsSuccess(false);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Credit"
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Adding credit to: <span className="font-semibold">{investorName}</span>
            </p>
            <p className="text-gray-600 mb-4">
              Current Balance: <span className="font-semibold">${currentBalance.toLocaleString()}</span>
            </p>
            
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Credit Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Add Credit
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Credit Added Successfully</h3>
          <p className="text-gray-600 mb-6">
            ${parseFloat(amount).toLocaleString()} has been added to {investorName}'s account.
          </p>
          <Button onClick={handleClose}>Close</Button>
        </div>
      )}
    </Modal>
  );
};

export default AddCreditModal;