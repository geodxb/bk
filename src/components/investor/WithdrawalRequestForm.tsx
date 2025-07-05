import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { Investor } from '../../types/user';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  ArrowDownRight,
  Calculator,
  Building,
  Bitcoin,
  CreditCard,
  Copy,
  Clock,
  Shield,
  XCircle
} from 'lucide-react';

interface WithdrawalRequestFormProps {
  currentBalance: number;
  investorName: string;
  investor: Investor; // New prop to receive investor data
  onSuccess?: () => void;
}

type WithdrawalMethod = 'bank' | 'crypto' | 'credit_card';
type CryptoType = 'BTC' | 'ETH' | 'XRP' | 'USDT';
type USDTNetwork = 'TRC20' | 'ERC20' | 'BEP20';

// Focused bank data for the 5 specified countries only
const banksByCountry: Record<string, string[]> = {
  'Mexico': [
    'Santander México',
    'Banorte',
    'BBVA México',
    'Banamex (Citibanamex)',
    'HSBC México',
    'Scotiabank México',
    'Banco Azteca',
    'Inbursa',
    'Banco del Bajío',
    'Banregio',
    'Multiva',
    'Mifel',
    'Banco Ahorro Famsa',
    'Banco Coppel',
    'BanCoppel'
  ],
  'France': [
    'BNP Paribas',
    'Crédit Agricole',
    'Société Générale',
    'Crédit Mutuel',
    'BPCE (Banque Populaire)',
    'La Banque Postale',
    'Crédit du Nord',
    'HSBC France',
    'ING Direct France',
    'Boursorama Banque',
    'Monabanq',
    'Hello bank!',
    'Fortuneo Banque',
    'BforBank',
    'Revolut France'
  ],
  'Switzerland': [
    'UBS',
    'Credit Suisse',
    'Julius Baer',
    'Pictet',
    'Lombard Odier',
    'Banque Cantonale Vaudoise',
    'Zürcher Kantonalbank',
    'PostFinance',
    'Raiffeisen Switzerland',
    'Migros Bank',
    'Cler Bank',
    'Bank Coop',
    'Hypothekarbank Lenzburg',
    'Valiant Bank',
    'Clientis'
  ],
  'Saudi Arabia': [
    'Saudi National Bank (SNB)',
    'Al Rajhi Bank',
    'Riyad Bank',
    'Banque Saudi Fransi',
    'Saudi British Bank (SABB)',
    'Arab National Bank',
    'Bank AlJazira',
    'Alinma Bank',
    'Bank Albilad',
    'Saudi Investment Bank',
    'First Abu Dhabi Bank Saudi Arabia',
    'Citibank Saudi Arabia',
    'HSBC Saudi Arabia',
    'Deutsche Bank Saudi Arabia',
    'JPMorgan Chase Saudi Arabia'
  ],
  'United Arab Emirates': [
    'Emirates NBD',
    'First Abu Dhabi Bank (FAB)',
    'Abu Dhabi Commercial Bank (ADCB)',
    'Dubai Islamic Bank',
    'Mashreq Bank',
    'Commercial Bank of Dubai',
    'Union National Bank',
    'Ajman Bank',
    'Bank of Sharjah',
    'Fujairah National Bank',
    'Ras Al Khaimah National Bank',
    'HSBC UAE',
    'Citibank UAE',
    'Standard Chartered UAE',
    'ADIB (Abu Dhabi Islamic Bank)'
  ]
};

const WithdrawalRequestForm = ({ 
  currentBalance, 
  investorName,
  investor, // Use the investor prop instead of hooks
  onSuccess 
}: WithdrawalRequestFormProps) => {
  // Form state
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('bank');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('BTC');
  const [selectedNetwork, setSelectedNetwork] = useState<USDTNetwork>('TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [creditCardData, setCreditCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Simplified country handling
  const investorCountry = investor?.country || 'Unknown';
  const accountStatus = investor?.accountStatus || 'Active';
  
  // Check account restrictions
  const isAccountClosed = accountStatus.toLowerCase().includes('closure');
  const isAccountRestricted = accountStatus.toLowerCase().includes('restricted');
  const isAccountActive = !isAccountClosed && !isAccountRestricted;

  // Validation functions that return error messages instead of setting state
  const getAmountValidationError = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Please enter a valid amount';
    }
    
    if (numAmount > currentBalance) {
      return 'Withdrawal amount cannot exceed your current balance';
    }
    
    if (numAmount < 100) {
      return 'Minimum withdrawal amount is $100';
    }
    
    return '';
  };

  const getStep2ValidationError = () => {
    if (method === 'bank' && !selectedBank) {
      return 'Please select a bank';
    }
    if (method === 'crypto' && !walletAddress.trim()) {
      return 'Please enter your wallet address';
    }
    if (method === 'credit_card' && (!creditCardData.number || !creditCardData.expiry || !creditCardData.cvv || !creditCardData.name)) {
      return 'Please fill in all credit card details';
    }
    return '';
  };

  const handleNext = () => {
    if (step === 1) {
      const amountError = getAmountValidationError();
      if (amountError) {
        setError(amountError);
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      const step2Error = getStep2ValidationError();
      if (step2Error) {
        setError(step2Error);
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!investor) return;
    
    // Final validation
    const amountError = getAmountValidationError();
    const step2Error = getStep2ValidationError();
    
    if (amountError) {
      setError(amountError);
      return;
    }
    
    if (step2Error) {
      setError(step2Error);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const withdrawalAmount = parseFloat(amount);
      const commissionAmount = withdrawalAmount * 0.15;
      const newBalance = currentBalance - withdrawalAmount;
      
      // Create withdrawal details based on method
      let withdrawalDetails = {
        method,
        amount: withdrawalAmount,
        commission: commissionAmount,
        netAmount: withdrawalAmount - commissionAmount
      };

      if (method === 'bank') {
        withdrawalDetails = {
          ...withdrawalDetails,
          bank: selectedBank,
          country: investorCountry
        };
      } else if (method === 'crypto') {
        withdrawalDetails = {
          ...withdrawalDetails,
          crypto: selectedCrypto,
          network: selectedCrypto === 'USDT' ? selectedNetwork : undefined,
          walletAddress
        };
      } else if (method === 'credit_card') {
        withdrawalDetails = {
          ...withdrawalDetails,
          cardLast4: creditCardData.number.slice(-4),
          cardName: creditCardData.name
        };
      }
      
      // 1. Update investor balance
      await FirestoreService.updateInvestorBalance(investor.id, newBalance);
      
      // 2. Add withdrawal request
      await FirestoreService.addWithdrawalRequest(
        investor.id,
        investorName,
        withdrawalAmount
      );
      
      // 3. Add withdrawal transaction
      await FirestoreService.addTransaction({
        investorId: investor.id,
        type: 'Withdrawal',
        amount: -withdrawalAmount,
        date: new Date().toISOString().split('T')[0],
        status: isAccountRestricted ? 'Pending Review' : 'Pending',
        description: `Withdrawal via ${method} - ${isAccountRestricted ? 'Manual review required' : 'Processing'}`
      });
      
      // 4. Add commission record
      await FirestoreService.addCommission({
        investorId: investor.id,
        investorName: investorName,
        withdrawalAmount: withdrawalAmount,
        commissionRate: 15,
        commissionAmount: commissionAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Earned'
      });
      
      setIsLoading(false);
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAmount('');
    setMethod('bank');
    setSelectedBank('');
    setSelectedCrypto('BTC');
    setSelectedNetwork('TRC20');
    setWalletAddress('');
    setCreditCardData({ number: '', expiry: '', cvv: '', name: '' });
    setError('');
    setIsSuccess(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Calculate preview
  const previewAmount = parseFloat(amount) || 0;
  const commissionPreview = previewAmount * 0.15;
  const netAmount = previewAmount - commissionPreview;

  // Check if step 1 is valid for button state
  const isStep1Valid = amount && !getAmountValidationError();

  // Account status messages
  if (isAccountClosed) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">WITHDRAWAL NOT AVAILABLE</h3>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <XCircle size={20} className="text-red-600 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-semibold mb-2 uppercase tracking-wide">WITHDRAWAL NOT AVAILABLE</h3>
                <p className="text-red-700 text-sm">
                  A withdrawal cannot be performed as your account will be deposited using the same method you used to make your first deposit or we will use the bank information provided during sign up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">WITHDRAWAL REQUEST SUBMITTED</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted Successfully</h3>
            <p className="text-gray-600 mb-6">
              Your withdrawal request for ${parseFloat(amount).toLocaleString()} has been submitted for processing.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Amount Requested</p>
                  <p className="font-bold text-gray-900">${parseFloat(amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Commission (15%)</p>
                  <p className="font-bold text-red-600">-${(parseFloat(amount) * 0.15).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Net Amount</p>
                  <p className="font-bold text-green-600">${(parseFloat(amount) * 0.85).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-bold text-gray-900">
                    {isAccountRestricted ? 'Pending Review' : 'Pending Approval'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>New Balance:</strong> ${(currentBalance - parseFloat(amount)).toLocaleString()}
              </p>
            </div>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ArrowDownRight size={20} className="mr-2" />
            Request Withdrawal
          </h3>
          <div className="text-sm text-gray-600 font-medium">
            Available: <span className="font-semibold">${currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Simplified Single Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount (USD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-400" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0.00"
                step="0.01"
                min="100"
                max={currentBalance}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: $100</p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {[1000, 5000, 10000, 25000].filter(quickAmount => quickAmount <= currentBalance).map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors border border-gray-200"
              >
                ${quickAmount.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(currentBalance.toString())}
              className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors border border-green-200"
            >
              Max: ${currentBalance.toLocaleString()}
            </button>
          </div>

          {/* Commission Preview */}
          {previewAmount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">Transaction Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-medium">${previewAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Commission (15%):</span>
                  <span className="font-medium text-red-600">-${commissionPreview.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Balance:</span>
                  <span className="font-medium text-blue-600">${(currentBalance - previewAmount).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-800">Net Amount to Receive:</span>
                  <span className="font-bold text-green-600">${netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Processing Information</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Withdrawals are processed within 1-3 business days</li>
              <li>• Funds will be transferred to your registered bank account</li>
              <li>• A 15% platform commission will be deducted</li>
              <li>• Your account balance will be updated immediately</li>
            </ul>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center mt-4">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !amount || parseFloat(amount) < 100 || parseFloat(amount) > currentBalance}
            className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownRight size={16} className="mr-2 inline" />
            {isLoading ? 'Processing...' : 'Submit Withdrawal Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequestForm;