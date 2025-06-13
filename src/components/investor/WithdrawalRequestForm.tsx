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

  // Enhanced country normalization function
  const normalizeCountryName = (rawCountry: string | undefined): string => {
    if (!rawCountry) return 'Unknown';
    
    const country = rawCountry.trim();
    
    // Direct exact matches first (case sensitive)
    if (banksByCountry[country]) {
      return country;
    }
    
    // Case insensitive exact matches
    const exactMatch = Object.keys(banksByCountry).find(
      key => key.toLowerCase() === country.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch;
    }
    
    // Comprehensive mapping for all variations
    const countryMappings: Record<string, string> = {
      // Mexico variations
      'mexico': 'Mexico',
      'méxico': 'Mexico',
      'mexican': 'Mexico',
      'mx': 'Mexico',
      'mex': 'Mexico',
      
      // France variations
      'france': 'France',
      'french': 'France',
      'fr': 'France',
      'francia': 'France',
      
      // Switzerland variations
      'switzerland': 'Switzerland',
      'swiss': 'Switzerland',
      'ch': 'Switzerland',
      'suisse': 'Switzerland',
      'schweiz': 'Switzerland',
      'svizzera': 'Switzerland',
      
      // Saudi Arabia variations
      'saudi arabia': 'Saudi Arabia',
      'saudi': 'Saudi Arabia',
      'ksa': 'Saudi Arabia',
      'kingdom of saudi arabia': 'Saudi Arabia',
      'sa': 'Saudi Arabia',
      'saudiarabia': 'Saudi Arabia',
      
      // UAE variations
      'united arab emirates': 'United Arab Emirates',
      'uae': 'United Arab Emirates',
      'emirates': 'United Arab Emirates',
      'u.a.e': 'United Arab Emirates',
      'u.a.e.': 'United Arab Emirates',
      'dubai': 'United Arab Emirates',
      'abu dhabi': 'United Arab Emirates'
    };
    
    // Check lowercase mapping
    const lowerCountry = country.toLowerCase();
    if (countryMappings[lowerCountry]) {
      return countryMappings[lowerCountry];
    }
    
    // Partial matching for common cases
    const lowerInput = lowerCountry;
    
    if (lowerInput.includes('mexico') || lowerInput.includes('méxico')) {
      return 'Mexico';
    }
    if (lowerInput.includes('france') || lowerInput.includes('french')) {
      return 'France';
    }
    if (lowerInput.includes('switzerland') || lowerInput.includes('swiss')) {
      return 'Switzerland';
    }
    if (lowerInput.includes('saudi')) {
      return 'Saudi Arabia';
    }
    if (lowerInput.includes('emirates') || lowerInput.includes('uae') || lowerInput.includes('dubai')) {
      return 'United Arab Emirates';
    }
    
    // Return original if no mapping found
    return country;
  };
  
  // Get investor country with proper normalization from the investor prop
  const rawCountry = investor?.country;
  const investorCountry = normalizeCountryName(rawCountry);
  const accountStatus = investor?.accountStatus || 'Active';
  
  // Get available banks for the investor's country
  const availableBanks = banksByCountry[investorCountry] || [];

  console.log('🏦 Fixed Withdrawal Form Debug:', {
    investorId: investor?.id,
    investorName,
    rawCountry,
    normalizedCountry: investorCountry,
    accountStatus,
    availableBanksCount: availableBanks.length,
    supportedCountries: Object.keys(banksByCountry),
    investorProp: investor ? 'Received' : 'Missing',
    banksByCountryKeys: Object.keys(banksByCountry),
    isCountrySupported: banksByCountry.hasOwnProperty(investorCountry)
  });

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
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">WITHDRAWAL REQUEST SUBMITTED</h3>
        </div>
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-6"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2 uppercase tracking-wide">WITHDRAWAL REQUEST SUBMITTED SUCCESSFULLY</h3>
              <p className="text-green-700 mb-4">
                Your withdrawal request for ${parseFloat(amount).toLocaleString()} has been successfully submitted.
              </p>
              
              <div className="bg-white p-4 rounded border border-green-200 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-600 uppercase tracking-wide">METHOD</p>
                    <p className="font-bold text-green-900 uppercase tracking-wide">{method.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-green-600 uppercase tracking-wide">STATUS</p>
                    <p className="font-bold text-green-900 uppercase tracking-wide">
                      {isAccountRestricted ? 'PENDING REVIEW' : 'PENDING APPROVAL'}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 uppercase tracking-wide">PROCESSING TIME</p>
                    <p className="font-bold text-green-900 uppercase tracking-wide">
                      {method === 'bank' ? '1-3 BUSINESS DAYS' : 
                       method === 'crypto' ? '30 MINUTES - 2 HOURS' : 
                       '3-5 BUSINESS DAYS'}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 uppercase tracking-wide">NET AMOUNT</p>
                    <p className="font-bold text-green-900">${(parseFloat(amount) * 0.85).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
              >
                SUBMIT ANOTHER REQUEST
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center uppercase tracking-wide">
            <ArrowDownRight size={20} className="mr-2" />
            REQUEST WITHDRAWAL
          </h3>
          <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
            AVAILABLE: <span className="font-semibold">${currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Country Not Supported Warning */}
        {availableBanks.length === 0 && investorCountry !== 'Unknown' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-amber-800 font-semibold uppercase tracking-wide">COUNTRY NOT SUPPORTED FOR BANK TRANSFERS</h4>
                <p className="text-amber-700 text-sm mt-1">
                  Bank withdrawals are not currently available for "{investorCountry}". 
                  Please use cryptocurrency or credit card withdrawal methods, or contact support for assistance.
                </p>
                <p className="text-amber-700 text-xs mt-2 uppercase tracking-wide">
                  SUPPORTED COUNTRIES: {Object.keys(banksByCountry).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Status Warning */}
        {isAccountRestricted && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield size={20} className="text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-amber-800 font-semibold uppercase tracking-wide">MANUAL REVIEW REQUIRED</h4>
                <p className="text-amber-700 text-sm mt-1">
                  This request will be manually reviewed because you have restrictions. If rejected, contact support for appeal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-medium uppercase tracking-wide ${
                step >= stepNum ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-600'
              }`}>
                {stepNum}
              </div>
              <div className="ml-2 text-sm font-medium uppercase tracking-wide">
                {stepNum === 1 && 'AMOUNT'}
                {stepNum === 2 && 'METHOD'}
                {stepNum === 3 && 'CONFIRM'}
              </div>
              {stepNum < 3 && <div className="w-12 h-0.5 bg-gray-300 mx-4"></div>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Amount */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  WITHDRAWAL AMOUNT (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 text-lg font-medium"
                    placeholder="0.00"
                    step="0.01"
                    min="100"
                    max={currentBalance}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">MINIMUM WITHDRAWAL: $100</p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {[1000, 5000, 10000, 25000].filter(quickAmount => quickAmount <= currentBalance).map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors border border-gray-200 font-medium uppercase tracking-wide"
                  >
                    ${quickAmount.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(currentBalance.toString())}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors border border-gray-200 font-medium uppercase tracking-wide"
                >
                  MAX: ${currentBalance.toLocaleString()}
                </button>
              </div>

              {/* Commission Preview */}
              {previewAmount > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center uppercase tracking-wide">
                    <Calculator size={16} className="mr-2" />
                    TRANSACTION PREVIEW
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 uppercase tracking-wide">WITHDRAWAL AMOUNT:</span>
                      <span className="font-medium">${previewAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 uppercase tracking-wide">PLATFORM COMMISSION (15%):</span>
                      <span className="font-medium text-red-600">-${commissionPreview.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-800 uppercase tracking-wide">NET AMOUNT TO RECEIVE:</span>
                      <span className="font-bold text-gray-900">${netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Method Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                  CHOOSE WITHDRAWAL METHOD
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setMethod('bank')}
                    disabled={availableBanks.length === 0}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      method === 'bank' ? 'border-gray-900 bg-gray-50' : 
                      availableBanks.length === 0 ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="font-medium uppercase tracking-wide">BANK TRANSFER</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {availableBanks.length === 0 ? 'NOT AVAILABLE' : '1-3 BUSINESS DAYS'}
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMethod('crypto')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      method === 'crypto' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Bitcoin size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="font-medium uppercase tracking-wide">CRYPTO WALLET</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">30 MIN - 2 HOURS</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMethod('credit_card')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      method === 'credit_card' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="font-medium uppercase tracking-wide">CREDIT CARD</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">3-5 BUSINESS DAYS</p>
                  </button>
                </div>
              </div>

              {/* Bank Transfer Options */}
              {method === 'bank' && availableBanks.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      SELECT BANK ({investorCountry})
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    >
                      <option value="">CHOOSE YOUR BANK...</option>
                      {availableBanks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                      {availableBanks.length} BANKS AVAILABLE FOR {investorCountry}. IF YOUR BANK IS NOT LISTED, CONTACT SUPPORT.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 uppercase tracking-wide">BANK TRANSFER INFORMATION</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• PROCESSING TIME: 1-3 BUSINESS DAYS</li>
                      <li>• FUNDS WILL BE TRANSFERRED TO YOUR REGISTERED BANK ACCOUNT</li>
                      <li>• BANK FEES MAY APPLY DEPENDING ON YOUR INSTITUTION</li>
                      <li>• INTERNATIONAL TRANSFERS MAY TAKE LONGER</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Crypto Options */}
              {method === 'crypto' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      SELECT CRYPTOCURRENCY
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['BTC', 'ETH', 'XRP', 'USDT'] as CryptoType[]).map(crypto => (
                        <button
                          key={crypto}
                          type="button"
                          onClick={() => setSelectedCrypto(crypto)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            selectedCrypto === crypto ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium uppercase tracking-wide">{crypto}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedCrypto === 'USDT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        SELECT USDT NETWORK
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['TRC20', 'ERC20', 'BEP20'] as USDTNetwork[]).map(network => (
                          <button
                            key={network}
                            type="button"
                            onClick={() => setSelectedNetwork(network)}
                            className={`p-3 border-2 rounded-lg transition-all ${
                              selectedNetwork === network ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className="font-medium uppercase tracking-wide">{network}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      {selectedCrypto} WALLET ADDRESS
                      {selectedCrypto === 'USDT' && ` (${selectedNetwork})`}
                    </label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                      placeholder={`ENTER YOUR ${selectedCrypto} WALLET ADDRESS`}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 uppercase tracking-wide">CRYPTO WITHDRAWAL INFORMATION</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• PROCESSING TIME: 30 MINUTES TO 2 HOURS</li>
                      <li>• NETWORK FEES WILL BE DEDUCTED FROM YOUR WITHDRAWAL</li>
                      <li>• DOUBLE-CHECK YOUR WALLET ADDRESS - TRANSACTIONS CANNOT BE REVERSED</li>
                      <li>• MINIMUM WITHDRAWAL AMOUNTS MAY APPLY PER CRYPTOCURRENCY</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Credit Card Options */}
              {method === 'credit_card' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        CARD NUMBER
                      </label>
                      <input
                        type="text"
                        value={creditCardData.number}
                        onChange={(e) => setCreditCardData({...creditCardData, number: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        CARDHOLDER NAME
                      </label>
                      <input
                        type="text"
                        value={creditCardData.name}
                        onChange={(e) => setCreditCardData({...creditCardData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="JOHN DOE"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        EXPIRY DATE
                      </label>
                      <input
                        type="text"
                        value={creditCardData.expiry}
                        onChange={(e) => setCreditCardData({...creditCardData, expiry: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={creditCardData.cvv}
                        onChange={(e) => setCreditCardData({...creditCardData, cvv: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 uppercase tracking-wide">CREDIT CARD WITHDRAWAL INFORMATION</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• PROCESSING TIME: 3-5 BUSINESS DAYS</li>
                      <li>• FUNDS WILL BE CREDITED BACK TO YOUR ORIGINAL PAYMENT CARD</li>
                      <li>• ADDITIONAL VERIFICATION MAY BE REQUIRED</li>
                      <li>• CREDIT CARD FEES MAY APPLY DEPENDING ON YOUR CARD ISSUER</li>
                      <li>• WITHDRAWALS CAN ONLY BE MADE TO CARDS USED FOR DEPOSITS</li>
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wide">WITHDRAWAL SUMMARY</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 uppercase tracking-wide">AMOUNT:</span>
                    <span className="font-medium">${parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 uppercase tracking-wide">METHOD:</span>
                    <span className="font-medium uppercase tracking-wide">{method.replace('_', ' ')}</span>
                  </div>
                  {method === 'bank' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 uppercase tracking-wide">BANK:</span>
                        <span className="font-medium">{selectedBank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 uppercase tracking-wide">COUNTRY:</span>
                        <span className="font-medium">{investorCountry}</span>
                      </div>
                    </>
                  )}
                  {method === 'crypto' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 uppercase tracking-wide">CRYPTOCURRENCY:</span>
                        <span className="font-medium">{selectedCrypto}</span>
                      </div>
                      {selectedCrypto === 'USDT' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 uppercase tracking-wide">NETWORK:</span>
                          <span className="font-medium">{selectedNetwork}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 uppercase tracking-wide">WALLET:</span>
                        <span className="font-medium text-xs">{walletAddress.slice(0, 10)}...{walletAddress.slice(-10)}</span>
                      </div>
                    </>
                  )}
                  {method === 'credit_card' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 uppercase tracking-wide">CARD:</span>
                      <span className="font-medium">****{creditCardData.number.slice(-4)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 uppercase tracking-wide">COMMISSION (15%):</span>
                      <span className="font-medium text-red-600">-${commissionPreview.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-800 uppercase tracking-wide">NET AMOUNT:</span>
                      <span className="font-bold text-gray-900">${netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-800 uppercase tracking-wide">PROCESSING TIME</h4>
                    <p className="text-gray-700 text-sm">
                      {method === 'bank' && 'YOUR WITHDRAWAL WILL BE PROCESSED WITHIN 1-3 BUSINESS DAYS.'}
                      {method === 'crypto' && 'YOUR WITHDRAWAL WILL BE PROCESSED WITHIN 30 MINUTES TO 2 HOURS.'}
                      {method === 'credit_card' && 'YOUR WITHDRAWAL WILL BE PROCESSED WITHIN 3-5 BUSINESS DAYS.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center mt-4">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
            >
              PREVIOUS
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!amount || (step === 1 && !isStep1Valid)}
              className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NEXT
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownRight size={16} className="mr-2 inline" />
              {isLoading ? 'SUBMITTING...' : 'SUBMIT WITHDRAWAL REQUEST'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequestForm;