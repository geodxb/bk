import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Upload, 
  DollarSign, 
  CreditCard,
  Building,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Bitcoin,
  Banknote,
  QrCode,
  Copy
} from 'lucide-react';

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  location: string;
  
  // Step 2: Identity Verification
  idType: string;
  idDocument: File | null;
  
  // Step 3: Deposit Details
  depositAmount: number;
  depositMethod: 'crypto' | 'bank';
  selectedCrypto?: string;
  proofOfTransfer?: File | null;
  
  // Step 4: Withdrawal Setup
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  swiftCode: string;
  bankAddress: string;
  accountCurrency: string;
}

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸', phone: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phone: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phone: '+44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phone: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phone: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phone: '+33' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', phone: '+52' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phone: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phone: '+966' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phone: '+41' },
];

const locationData: Record<string, string[]> = {
  'US': ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania'],
  'CA': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan'],
  'AU': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
  'GB': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield'],
  'DE': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart'],
  'FR': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes'],
  'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León'],
  'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
  'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
  'CH': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur'],
};

const cryptoWallets = [
  { 
    name: 'Bitcoin (BTC)', 
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    icon: <Bitcoin size={20} className="text-orange-500" />
  },
  { 
    name: 'Ethereum (ETH)', 
    address: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
    icon: <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">Ξ</div>
  },
  { 
    name: 'USDT (TRC20)', 
    address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK',
    icon: <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">₮</div>
  },
];

const AddInvestorModal = ({ isOpen, onClose, onSuccess }: AddInvestorModalProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    country: '',
    location: '',
    idType: '',
    idDocument: null,
    depositAmount: 100,
    depositMethod: 'crypto',
    selectedCrypto: 'Bitcoin (BTC)',
    proofOfTransfer: null,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    bankAddress: '',
    accountCurrency: 'USD'
  });

  const steps = [
    { number: 1, title: 'Personal Information', icon: <User size={18} /> },
    { number: 2, title: 'Identity Verification', icon: <Shield size={18} /> },
    { number: 3, title: 'Deposit Details', icon: <DollarSign size={18} /> },
    { number: 4, title: 'Withdrawal Setup', icon: <Building size={18} /> }
  ];

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.location) newErrors.location = 'Location is required';
        break;
      case 2:
        if (!formData.idType) newErrors.idType = 'ID type is required';
        if (!formData.idDocument) newErrors.idDocument = 'ID document is required';
        break;
      case 3:
        if (formData.depositAmount < 100) newErrors.depositAmount = 'Minimum deposit is $100';
        if (formData.depositMethod === 'bank' && !formData.proofOfTransfer) {
          newErrors.proofOfTransfer = 'Proof of transfer is required for bank deposits';
        }
        break;
      case 4:
        if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
        if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
        if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
        if (!formData.swiftCode.trim()) newErrors.swiftCode = 'SWIFT/BIC code is required';
        if (!formData.bankAddress.trim()) newErrors.bankAddress = 'Bank address is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCountrySelect = (country: any) => {
    setFormData(prev => ({
      ...prev,
      country: country.name,
      countryCode: country.phone,
      location: '' // Reset location when country changes
    }));
    setCountrySearch('');
  };

  const handleFileUpload = (field: 'idDocument' | 'proofOfTransfer', file: File) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, [field]: 'File size must be less than 5MB' }));
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [field]: 'Only JPG, PNG, and PDF files are allowed' }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: file }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async () => {
    if (!validateStep(4) || !user) return;

    setIsLoading(true);
    try {
      // Create investor profile
      const investorData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        country: formData.country,
        location: formData.location,
        joinDate: new Date().toISOString().split('T')[0],
        initialDeposit: formData.depositAmount,
        currentBalance: formData.depositAmount,
        role: 'investor',
        isActive: true,
        accountStatus: 'Active - Pending Verification',
        tradingData: {
          positionsPerDay: 0,
          pairs: [],
          platform: 'IBKR',
          leverage: 100,
          currency: formData.accountCurrency
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          swiftCode: formData.swiftCode,
          bankAddress: formData.bankAddress,
          currency: formData.accountCurrency
        },
        verification: {
          idType: formData.idType,
          depositMethod: formData.depositMethod,
          selectedCrypto: formData.selectedCrypto
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Generate unique investor ID
      const investorId = 'investor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Save to Firestore
      await FirestoreService.createInvestor(investorId, investorData);

      // Add initial deposit transaction
      await FirestoreService.addTransaction({
        investorId,
        type: 'Deposit',
        amount: formData.depositAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        description: `Initial deposit via ${formData.depositMethod === 'crypto' ? formData.selectedCrypto : 'bank transfer'}`
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating investor:', error);
      setErrors({ submit: 'Failed to create investor. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+1',
      country: '',
      location: '',
      idType: '',
      idDocument: null,
      depositAmount: 100,
      depositMethod: 'crypto',
      selectedCrypto: 'Bitcoin (BTC)',
      proofOfTransfer: null,
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      swiftCode: '',
      bankAddress: '',
      accountCurrency: 'USD'
    });
    setErrors({});
    setIsSuccess(false);
    setCountrySearch('');
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john.doe@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.phone}>
                      {country.flag} {country.phone}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123-456-7890"
                  />
                </div>
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch || formData.country}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search countries..."
                />
                {countrySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredCountries.map(country => (
                      <button
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
            </div>

            {formData.country && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {['US', 'CA', 'AU'].includes(countries.find(c => c.name === formData.country)?.code || '') ? 'State/Province' : 'City'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select location...</option>
                  {locationData[countries.find(c => c.name === formData.country)?.code || '']?.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {['National ID Card', 'Passport', 'Driver\'s License'].map(type => (
                  <label key={type} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="idType"
                      value={type}
                      checked={formData.idType === type}
                      onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
                      className="mr-3"
                    />
                    <Shield size={18} className="mr-2 text-gray-400" />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
              {errors.idType && <p className="text-red-500 text-sm mt-1">{errors.idType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ID Document <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">JPG, PNG, PDF (max 5MB)</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                  className="hidden"
                  id="idDocument"
                />
                <label htmlFor="idDocument">
                  <Button variant="outline" className="cursor-pointer">
                    Choose File
                  </Button>
                </label>
                {formData.idDocument && (
                  <p className="text-green-600 text-sm mt-2">
                    ✓ {formData.idDocument.name}
                  </p>
                )}
              </div>
              {errors.idDocument && <p className="text-red-500 text-sm mt-1">{errors.idDocument}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="100"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: Number(e.target.value) }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Minimum deposit: $100</p>
              {errors.depositAmount && <p className="text-red-500 text-sm mt-1">{errors.depositAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.depositMethod === 'crypto' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="depositMethod"
                    value="crypto"
                    checked={formData.depositMethod === 'crypto'}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositMethod: e.target.value as 'crypto' | 'bank' }))}
                    className="mr-3"
                  />
                  <Bitcoin size={20} className="mr-2 text-orange-500" />
                  <span>Cryptocurrency</span>
                </label>
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.depositMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="depositMethod"
                    value="bank"
                    checked={formData.depositMethod === 'bank'}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositMethod: e.target.value as 'crypto' | 'bank' }))}
                    className="mr-3"
                  />
                  <Banknote size={20} className="mr-2 text-green-500" />
                  <span>Bank Transfer</span>
                </label>
              </div>
            </div>

            {formData.depositMethod === 'crypto' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cryptocurrency
                  </label>
                  <div className="space-y-2">
                    {cryptoWallets.map(crypto => (
                      <label key={crypto.name} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.selectedCrypto === crypto.name ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="selectedCrypto"
                          value={crypto.name}
                          checked={formData.selectedCrypto === crypto.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, selectedCrypto: e.target.value }))}
                          className="mr-3"
                        />
                        {crypto.icon}
                        <span className="ml-2">{crypto.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.selectedCrypto && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <QrCode size={18} className="mr-2" />
                      Wallet Address for {formData.selectedCrypto}
                    </h4>
                    <div className="bg-white p-3 rounded border flex items-center justify-between">
                      <code className="text-sm text-gray-800 break-all">
                        {cryptoWallets.find(c => c.name === formData.selectedCrypto)?.address}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(cryptoWallets.find(c => c.name === formData.selectedCrypto)?.address || '')}
                      >
                        <Copy size={14} className="mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Send exactly ${formData.depositAmount} worth of {formData.selectedCrypto} to this address
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.depositMethod === 'bank' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-medium">Trading Affiliate Bank</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SWIFT Code:</span>
                      <span className="font-medium">TABKUS33</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Proof of Transfer <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 mb-2">Upload bank transfer receipt</p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfTransfer', e.target.files[0])}
                      className="hidden"
                      id="proofOfTransfer"
                    />
                    <label htmlFor="proofOfTransfer">
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                    {formData.proofOfTransfer && (
                      <p className="text-green-600 text-sm mt-2">
                        ✓ {formData.proofOfTransfer.name}
                      </p>
                    )}
                  </div>
                  {errors.proofOfTransfer && <p className="text-red-500 text-sm mt-1">{errors.proofOfTransfer}</p>}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full name as on bank account"
              />
              {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Bank of America"
                />
                {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accountCurrency}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountCurrency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number/IBAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234567890 or IBAN"
                />
                {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SWIFT/BIC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BOFAUS3N"
                />
                {errors.swiftCode && <p className="text-red-500 text-sm mt-1">{errors.swiftCode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.bankAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Full bank address including city, state, and country"
              />
              {errors.bankAddress && <p className="text-red-500 text-sm mt-1">{errors.bankAddress}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Investor Added Successfully" size="md">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Investor Created Successfully!</h3>
          <p className="text-gray-600 mb-6">
            {formData.firstName} {formData.lastName} has been added to the platform. They will receive an email with login instructions.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{formData.firstName} {formData.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{formData.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Initial Deposit</p>
                <p className="font-medium">${formData.depositAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Country</p>
                <p className="font-medium">{formData.country}</p>
              </div>
            </div>
          </div>
          <Button onClick={handleClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Investor" size="lg">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.number
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <Check size={18} />
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {steps[currentStep - 1].title}
              </h3>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handlePrevious}
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft size={18} className="mr-1" />
                Previous
              </>
            )}
          </Button>
          
          {currentStep < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
              <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={isLoading}
            >
              <Check size={18} className="mr-2" />
              Create Investor
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddInvestorModal;