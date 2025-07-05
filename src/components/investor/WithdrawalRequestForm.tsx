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
  XCircle,
  User,
  Phone,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface WithdrawalRequestFormProps {
  currentBalance: number;
  investorName: string;
  investor: Investor;
  onSuccess?: () => void;
}

type WithdrawalMethod = 'bank' | 'crypto' | 'credit_card';
type CryptoType = 'BTC' | 'ETH' | 'XRP' | 'USDT';
type USDTNetwork = 'TRC20' | 'ERC20' | 'BEP20';

// Enhanced bank data for the 5 specified countries
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

// Bank form fields for each country
const bankFormFields: Record<string, any> = {
  'Mexico': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'accountNumber', label: 'Account Number (CLABE)', type: 'text', required: true, maxLength: 18 },
      { name: 'bankBranch', label: 'Bank Branch', type: 'text', required: false },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'MXN'
  },
  'France': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 34 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'EUR'
  },
  'Switzerland': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 21 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'CHF'
  },
  'Saudi Arabia': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 24 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'SAR'
  },
  'United Arab Emirates': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 23 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'emiratesId', label: 'Emirates ID', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'AED'
  }
};

const WithdrawalRequestForm = ({ 
  currentBalance, 
  investorName,
  investor,
  onSuccess 
}: WithdrawalRequestFormProps) => {
  // Form state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('bank');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankFormData, setBankFormData] = useState<Record<string, string>>({});
  const [showBankForm, setShowBankForm] = useState(false);
  
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
      'mexico': 'Mexico', 'méxico': 'Mexico', 'mexican': 'Mexico', 'mx': 'Mexico', 'mex': 'Mexico',
      'france': 'France', 'french': 'France', 'fr': 'France', 'francia': 'France',
      'switzerland': 'Switzerland', 'swiss': 'Switzerland', 'ch': 'Switzerland', 'suisse': 'Switzerland',
      'saudi arabia': 'Saudi Arabia', 'saudi': 'Saudi Arabia', 'ksa': 'Saudi Arabia', 'sa': 'Saudi Arabia',
      'united arab emirates': 'United Arab Emirates', 'uae': 'United Arab Emirates', 'emirates': 'United Arab Emirates', 'dubai': 'United Arab Emirates'
    };
    
    const lowerCountry = country.toLowerCase();
    if (countryMappings[lowerCountry]) {
      return countryMappings[lowerCountry];
    }
    
    return country;
  };
  
  // Get investor country and account status
  const investorCountry = normalizeCountryName(investor?.country);
  const accountStatus = investor?.accountStatus || 'Active';
  
  // Get available banks and form fields for the investor's country
  const availableBanks = banksByCountry[investorCountry] || [];
  const countryBankFields = bankFormFields[investorCountry];

  // Enhanced account restriction checking
  const isAccountClosed = accountStatus.toLowerCase().includes('closed') || 
                         accountStatus.toLowerCase().includes('deletion');
  const isPolicyViolation = accountStatus.toLowerCase().includes('policy violation') ||
                           accountStatus.toLowerCase().includes('restricted');
  const isPermanentlyClosed = accountStatus.toLowerCase().includes('permanently closed') ||
                             accountStatus.toLowerCase().includes('permanent');

  // Validation functions
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

  const getBankFormValidationError = () => {
    if (!selectedBank) {
      return 'Please select a bank';
    }
    
    if (countryBankFields) {
      for (const field of countryBankFields.fields) {
        if (field.required && !bankFormData[field.name]?.trim()) {
          return `Please enter ${field.label}`;
        }
      }
    }
    
    return '';
  };

  const handleBankFormChange = (fieldName: string, value: string) => {
    setBankFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async () => {
    if (!investor) return;
    
    // Validation
    const amountError = getAmountValidationError();
    const bankError = method === 'bank' ? getBankFormValidationError() : '';
    
    if (amountError) {
      setError(amountError);
      return;
    }
    
    if (bankError) {
      setError(bankError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const withdrawalAmount = parseFloat(amount);
      const commissionAmount = withdrawalAmount * 0.15;
      const newBalance = currentBalance - withdrawalAmount;
      
      // Update investor balance
      await FirestoreService.updateInvestorBalance(investor.id, newBalance);
      
      // Add withdrawal request
      await FirestoreService.addWithdrawalRequest(
        investor.id,
        investorName,
        withdrawalAmount
      );
      
      // Determine status based on account restrictions
      let transactionStatus = 'Pending';
      let description = `Withdrawal via ${method}`;
      
      if (isPolicyViolation) {
        transactionStatus = 'Pending Review';
        description += ' - Manual review required due to policy violation';
      }
      
      // Add withdrawal transaction
      await FirestoreService.addTransaction({
        investorId: investor.id,
        type: 'Withdrawal',
        amount: -withdrawalAmount,
        date: new Date().toISOString().split('T')[0],
        status: transactionStatus,
        description: description
      });
      
      // Add commission record
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
    setAmount('');
    setSelectedBank('');
    setBankFormData({});
    setShowBankForm(false);
    setError('');
    setIsSuccess(false);
  };

  // Calculate preview
  const previewAmount = parseFloat(amount) || 0;
  const commissionPreview = previewAmount * 0.15;
  const netAmount = previewAmount - commissionPreview;

  // Account status messages - Enhanced for different violation types
  if (isPermanentlyClosed) {
    return (
      <div className="bg-white border border-red-300 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900">ACCOUNT PERMANENTLY CLOSED</h3>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <XCircle size={24} className="text-red-600 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-semibold mb-2">WITHDRAWALS NOT AVAILABLE</h3>
                <p className="text-red-700 text-sm mb-3">
                  This account has been permanently closed due to policy violations. No withdrawals can be processed.
                </p>
                <p className="text-red-700 text-sm">
                  Only account closure procedures are available. Please contact support for assistance with account closure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAccountClosed) {
    return (
      <div className="bg-white border border-amber-300 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
          <h3 className="text-lg font-semibold text-amber-900">ACCOUNT CLOSURE IN PROGRESS</h3>
        </div>
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={24} className="text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-amber-800 font-semibold mb-2">WITHDRAWAL NOT AVAILABLE</h3>
                <p className="text-amber-700 text-sm">
                  This account is scheduled for closure. Withdrawals will be processed using the same method 
                  used for your initial deposit or transferred to the bank information provided during registration.
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Withdrawal Request Submitted Successfully</h3>
            <p className="text-gray-600 mb-6">
              Your withdrawal request for ${parseFloat(amount).toLocaleString()} has been submitted for approval and is now pending review.
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
                  <p className="font-bold text-amber-600">Pending Approval</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Updated Account Balance:</strong> ${(currentBalance - parseFloat(amount)).toLocaleString()}
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Your account balance has been updated to reflect the withdrawal request.
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
              <div className="flex items-start space-x-3">
                <Clock size={20} className="text-amber-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-semibold text-amber-800">Processing Information</h4>
                  <p className="text-amber-700 text-sm mt-1">
                    {isPolicyViolation 
                      ? 'Your request requires manual review due to account restrictions. Processing may take 5-10 business days.'
                      : 'Your withdrawal request will be reviewed and processed within 1-3 business days.'
                    }
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    You will be notified once the withdrawal has been approved and processed.
                  </p>
                </div>
              </div>
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
        {/* Policy Violation Warning */}
        {isPolicyViolation && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-red-600 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-semibold">Manual Review Required</h4>
                <p className="text-red-700 text-sm mt-1">
                  Due to policy violations on your account, all withdrawal requests require manual review. 
                  Processing may take additional time and approval is not guaranteed.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Amount Input */}
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

          {/* Bank Selection and Form */}
          {previewAmount >= 100 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Bank Information</h4>
                <span className="text-sm text-gray-600">Country: {investorCountry}</span>
              </div>
              
              {availableBanks.length > 0 ? (
                <div className="space-y-4">
                  {/* Bank Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        setShowBankForm(!!e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose your bank...</option>
                      {availableBanks.map((bank, index) => (
                        <option key={index} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bank Form */}
                  {showBankForm && selectedBank && countryBankFields && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-4">
                        Bank Account Details for {selectedBank}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {countryBankFields.fields.map((field: any) => (
                          <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                              {field.name === 'accountHolderName' && (
                                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              )}
                              {field.name === 'phoneNumber' && (
                                <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              )}
                              {field.name === 'address' && (
                                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              )}
                              <input
                                type={field.type}
                                value={bankFormData[field.name] || ''}
                                onChange={(e) => handleBankFormChange(field.name, e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  ['accountHolderName', 'phoneNumber', 'address'].includes(field.name) ? 'pl-9' : ''
                                }`}
                                placeholder={field.label}
                                maxLength={field.maxLength}
                                required={field.required}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-blue-800 text-sm">
                          <strong>Currency:</strong> Funds will be converted to {countryBankFields.currency} at current exchange rates.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="text-amber-800 font-semibold">Bank Transfer Not Available</h4>
                      <p className="text-amber-700 text-sm mt-1">
                        Bank withdrawals are not currently available for "{investorCountry}". 
                        Please contact support for alternative withdrawal methods.
                      </p>
                      <p className="text-amber-700 text-xs mt-2">
                        Supported countries: {Object.keys(banksByCountry).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Processing Information</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• {isPolicyViolation ? 'Manual review required - Processing time: 5-10 business days' : 'Request will be submitted for approval - Processing time: 1-3 business days'}</li>
              <li>• Once approved, funds will be transferred to your selected bank account</li>
              <li>• A 15% platform commission will be deducted</li>
              <li>• Your account balance will be updated immediately</li>
              {selectedBank && <li>• Selected bank: {selectedBank}</li>}
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
            disabled={
              isLoading || 
              !amount || 
              parseFloat(amount) < 100 || 
              parseFloat(amount) > currentBalance ||
              (availableBanks.length > 0 && (!selectedBank || !showBankForm || getBankFormValidationError()))
            }
            className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownRight size={16} className="mr-2 inline" />
            {isLoading ? 'Processing...' : 
             !selectedBank && availableBanks.length > 0 ? 'Select Bank to Continue' :
             getBankFormValidationError() ? 'Complete Bank Details' :
             isPolicyViolation ? 'Submit for Manual Review' :
             'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequestForm;