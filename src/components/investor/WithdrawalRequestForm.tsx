import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestor } from '../../hooks/useFirestore';
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
  onSuccess?: () => void;
}

type WithdrawalMethod = 'bank' | 'crypto' | 'credit_card';
type CryptoType = 'BTC' | 'ETH' | 'XRP' | 'USDT';
type USDTNetwork = 'TRC20' | 'ERC20' | 'BEP20';

// Comprehensive bank data by country
const banksByCountry: Record<string, string[]> = {
  // North America
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
  'United States': [
    'Bank of America',
    'JPMorgan Chase',
    'Wells Fargo',
    'Citibank',
    'U.S. Bank',
    'PNC Bank',
    'Truist Bank',
    'Goldman Sachs Bank',
    'TD Bank',
    'Capital One',
    'HSBC Bank USA',
    'Fifth Third Bank',
    'Regions Bank',
    'KeyBank',
    'Huntington Bank'
  ],
  'Canada': [
    'Royal Bank of Canada (RBC)',
    'Toronto-Dominion Bank (TD)',
    'Bank of Nova Scotia (Scotiabank)',
    'Bank of Montreal (BMO)',
    'Canadian Imperial Bank of Commerce (CIBC)',
    'National Bank of Canada',
    'Desjardins Group',
    'HSBC Bank Canada',
    'Laurentian Bank',
    'Canadian Western Bank',
    'Tangerine Bank',
    'President\'s Choice Financial',
    'Simplii Financial',
    'Mogo',
    'Koodo Financial Services'
  ],

  // Europe
  'United Kingdom': [
    'Barclays',
    'HSBC UK',
    'Lloyds Banking Group',
    'NatWest Group',
    'Santander UK',
    'Standard Chartered',
    'TSB Bank',
    'Virgin Money UK',
    'Metro Bank',
    'Monzo',
    'Starling Bank',
    'Revolut',
    'Nationwide Building Society',
    'Halifax',
    'First Direct'
  ],
  'Germany': [
    'Deutsche Bank',
    'Commerzbank',
    'DZ Bank',
    'Sparkasse',
    'Postbank',
    'HypoVereinsbank',
    'Landesbank Baden-Württemberg',
    'Bayerische Landesbank',
    'ING-DiBa',
    'Santander Consumer Bank',
    'Targobank',
    'Comdirect Bank',
    'N26',
    'Consorsbank',
    'Oldenburgische Landesbank'
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
  'Spain': [
    'Santander',
    'BBVA',
    'CaixaBank',
    'Bankia (now CaixaBank)',
    'Banco Sabadell',
    'Bankinter',
    'Unicaja Banco',
    'Liberbank',
    'Abanca',
    'Kutxabank',
    'Cajamar',
    'EVO Banco',
    'ING España',
    'N26 España',
    'Revolut España'
  ],
  'Italy': [
    'UniCredit',
    'Intesa Sanpaolo',
    'Monte dei Paschi di Siena',
    'UBI Banca (now Intesa Sanpaolo)',
    'BPER Banca',
    'Banco BPM',
    'Credito Emiliano',
    'Banca Mediolanum',
    'Banca Popolare di Sondrio',
    'Banca Carige',
    'ING Bank Italia',
    'Fineco Bank',
    'CheBanca!',
    'Widiba',
    'N26 Italia'
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
  'Netherlands': [
    'ING Bank',
    'ABN AMRO',
    'Rabobank',
    'de Volksbank',
    'Triodos Bank',
    'Van Lanschot Kempen',
    'NIBC Bank',
    'Knab',
    'bunq',
    'Revolut Netherlands',
    'N26 Netherlands',
    'Moneyou',
    'LeasePlan Bank',
    'HSBC Netherlands',
    'BinckBank'
  ],

  // Middle East
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
  ],
  'Qatar': [
    'Qatar National Bank (QNB)',
    'Commercial Bank of Qatar',
    'Doha Bank',
    'Ahli Bank',
    'Qatar Islamic Bank',
    'International Bank of Qatar',
    'Masraf Al Rayan',
    'Qatar Development Bank',
    'HSBC Qatar',
    'Standard Chartered Qatar',
    'Citibank Qatar',
    'Deutsche Bank Qatar',
    'BNP Paribas Qatar',
    'Credit Suisse Qatar',
    'JPMorgan Chase Qatar'
  ],
  'Kuwait': [
    'National Bank of Kuwait',
    'Kuwait Finance House',
    'Ahli United Bank Kuwait',
    'Commercial Bank of Kuwait',
    'Gulf Bank',
    'Burgan Bank',
    'Kuwait International Bank',
    'Warba Bank',
    'Boubyan Bank',
    'Al Ahli Bank of Kuwait',
    'HSBC Kuwait',
    'Citibank Kuwait',
    'Standard Chartered Kuwait',
    'BNP Paribas Kuwait',
    'Credit Agricole Kuwait'
  ],

  // Asia Pacific
  'Australia': [
    'Commonwealth Bank of Australia',
    'Westpac Banking Corporation',
    'Australia and New Zealand Banking Group (ANZ)',
    'National Australia Bank (NAB)',
    'Bendigo and Adelaide Bank',
    'Bank of Queensland',
    'Suncorp Bank',
    'ING Australia',
    'Macquarie Bank',
    'HSBC Australia',
    'Citibank Australia',
    'UBank',
    'ME Bank',
    'Great Southern Bank',
    'Heritage Bank'
  ],
  'Japan': [
    'Mitsubishi UFJ Financial Group',
    'Sumitomo Mitsui Banking Corporation',
    'Mizuho Financial Group',
    'Japan Post Bank',
    'Resona Holdings',
    'Shinsei Bank',
    'Aozora Bank',
    'Seven Bank',
    'Rakuten Bank',
    'Sony Bank',
    'SBI Sumishin Net Bank',
    'Citibank Japan',
    'HSBC Japan',
    'Standard Chartered Japan',
    'Deutsche Bank Japan'
  ],
  'Singapore': [
    'DBS Bank',
    'Oversea-Chinese Banking Corporation (OCBC)',
    'United Overseas Bank (UOB)',
    'Citibank Singapore',
    'Standard Chartered Singapore',
    'HSBC Singapore',
    'Maybank Singapore',
    'Bank of China Singapore',
    'CIMB Bank Singapore',
    'RHB Bank Singapore',
    'ANZ Singapore',
    'BNP Paribas Singapore',
    'Credit Suisse Singapore',
    'Deutsche Bank Singapore',
    'JPMorgan Chase Singapore'
  ],

  // South America
  'Brazil': [
    'Banco do Brasil',
    'Itaú Unibanco',
    'Bradesco',
    'Santander Brasil',
    'Caixa Econômica Federal',
    'Banco BTG Pactual',
    'Banco Safra',
    'Banco Votorantim',
    'Banco Inter',
    'Nubank',
    'C6 Bank',
    'Original Bank',
    'Banco Pan',
    'Banco Pine',
    'Banco Modal'
  ],
  'Argentina': [
    'Banco de la Nación Argentina',
    'Banco de la Provincia de Buenos Aires',
    'BBVA Argentina',
    'Santander Argentina',
    'Banco Macro',
    'Banco Galicia',
    'Banco Supervielle',
    'Banco Patagonia',
    'Banco Ciudad',
    'ICBC Argentina',
    'HSBC Argentina',
    'Citibank Argentina',
    'Banco Hipotecario',
    'Banco Comafi',
    'Banco Credicoop'
  ],
  'Chile': [
    'Banco de Chile',
    'BancoEstado',
    'Santander Chile',
    'Banco de Crédito e Inversiones (BCI)',
    'Scotiabank Chile',
    'Banco Itaú Chile',
    'Banco Security',
    'Banco Falabella',
    'Banco Ripley',
    'Banco Consorcio',
    'HSBC Chile',
    'Banco Internacional',
    'Banco BICE',
    'Banco Edwards Citi',
    'Coopeuch'
  ],
  'Colombia': [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA Colombia',
    'Banco Popular',
    'Banco de Occidente',
    'Banco Caja Social',
    'Banco AV Villas',
    'Banco Agrario',
    'Banco GNB Sudameris',
    'Citibank Colombia',
    'HSBC Colombia',
    'Banco Pichincha Colombia',
    'Banco Cooperativo Coopcentral',
    'Banco Mundo Mujer'
  ],
  'Peru': [
    'Banco de Crédito del Perú (BCP)',
    'BBVA Perú',
    'Scotiabank Perú',
    'Interbank',
    'Banco de la Nación',
    'Banco Continental',
    'Banco Financiero',
    'Banco GNB',
    'Banco Falabella Perú',
    'Banco Ripley Perú',
    'Citibank Perú',
    'HSBC Perú',
    'Banco Santander Perú',
    'Banco Azteca Perú',
    'Mi Banco'
  ],
  'Ecuador': [
    'Banco Pichincha',
    'Banco del Pacífico',
    'Produbanco',
    'Banco Guayaquil',
    'Banco Internacional',
    'Banco Bolivariano',
    'Banco del Austro',
    'Banco Machala',
    'Banco ProCredit',
    'Banco Solidario',
    'Banco de Loja',
    'Banco Comercial de Manabí',
    'Banco Capital',
    'Banco Coopnacional',
    'Banco D-Miro'
  ],
  'Venezuela': [
    'Banco de Venezuela',
    'Banesco',
    'Mercantil',
    'Provincial',
    'Bicentenario',
    'Banco Exterior',
    'Bancaribe',
    'Banco Activo',
    'Banco Plaza',
    'Banco Sofitasa',
    'Banco del Tesoro',
    'Banco Agrícola de Venezuela',
    'Banco Nacional de Crédito',
    'Banco Caroní',
    'Banco Fondo Común'
  ],
  'Uruguay': [
    'Banco República',
    'Banco Santander Uruguay',
    'BBVA Uruguay',
    'Itaú Uruguay',
    'Banco Heritage',
    'Banco Hipotecario del Uruguay',
    'Citibank Uruguay',
    'HSBC Uruguay',
    'Banco de la Nación Argentina (Uruguay)',
    'Banco Bilbao Vizcaya Argentaria',
    'Banco Comercial',
    'Banco de Crédito',
    'Banco Discount',
    'Banco Prex',
    'TuDinero'
  ],
  'Paraguay': [
    'Banco Continental',
    'Banco Nacional de Fomento',
    'Itaú Paraguay',
    'Banco Atlas',
    'Vision Banco',
    'Banco Regional',
    'Banco Familiar',
    'Banco GNB Paraguay',
    'Banco Sudameris',
    'Banco do Brasil Paraguay',
    'Citibank Paraguay',
    'HSBC Paraguay',
    'Banco Amambay',
    'Banco Basa',
    'TiCo Bank'
  ],

  // Africa
  'South Africa': [
    'Standard Bank',
    'FirstRand Bank',
    'ABSA Bank',
    'Nedbank',
    'Capitec Bank',
    'Investec Bank',
    'African Bank',
    'Bidvest Bank',
    'Sasfin Bank',
    'Mercantile Bank',
    'Citibank South Africa',
    'HSBC South Africa',
    'Standard Chartered South Africa',
    'Bank of China South Africa',
    'Habib Overseas Bank'
  ],
  'Nigeria': [
    'First Bank of Nigeria',
    'Zenith Bank',
    'Guaranty Trust Bank',
    'Access Bank',
    'United Bank for Africa',
    'Fidelity Bank',
    'Union Bank of Nigeria',
    'Sterling Bank',
    'Stanbic IBTC Bank',
    'Ecobank Nigeria',
    'Citibank Nigeria',
    'Standard Chartered Nigeria',
    'HSBC Nigeria',
    'Heritage Bank',
    'Keystone Bank'
  ],
  'Egypt': [
    'National Bank of Egypt',
    'Banque Misr',
    'Commercial International Bank',
    'QNB Alahli',
    'Banque du Caire',
    'Arab African International Bank',
    'HSBC Egypt',
    'Citibank Egypt',
    'Credit Agricole Egypt',
    'Société Générale Egypt',
    'Union National Bank Egypt',
    'Emirates NBD Egypt',
    'Mashreq Bank Egypt',
    'Bank of Alexandria',
    'Export Development Bank of Egypt'
  ],

  // Default fallback
  'Unknown': [
    'Bank of America',
    'JPMorgan Chase',
    'Wells Fargo',
    'Citibank',
    'HSBC',
    'Standard Chartered',
    'Deutsche Bank',
    'BNP Paribas',
    'Santander',
    'BBVA'
  ]
};

const WithdrawalRequestForm = ({ 
  currentBalance, 
  investorName,
  onSuccess 
}: WithdrawalRequestFormProps) => {
  const { user } = useAuth();
  const { investor } = useInvestor(user?.id || '');
  
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

  // Get investor country and account status
  const investorCountry = investor?.country || 'Unknown';
  const accountStatus = investor?.accountStatus || 'Active';
  const availableBanks = banksByCountry[investorCountry] || banksByCountry['Unknown'];

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
    if (!user) return;
    
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
      await FirestoreService.updateInvestorBalance(user.id, newBalance);
      
      // 2. Add withdrawal request
      await FirestoreService.addWithdrawalRequest(
        user.id,
        investorName,
        withdrawalAmount
      );
      
      // 3. Add withdrawal transaction
      await FirestoreService.addTransaction({
        investorId: user.id,
        type: 'Withdrawal',
        amount: -withdrawalAmount,
        date: new Date().toISOString().split('T')[0],
        status: isAccountRestricted ? 'Pending Review' : 'Pending',
        description: `Withdrawal via ${method} - ${isAccountRestricted ? 'Manual review required' : 'Processing'}`
      });
      
      // 4. Add commission record
      await FirestoreService.addCommission({
        investorId: user.id,
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <XCircle size={20} className="text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-2">Withdrawal Not Available</h3>
            <p className="text-red-700 text-sm">
              A withdrawal cannot be performed as your account will be deposited using the same method you used to make your first deposit or we will use the bank information provided during sign up.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Withdrawal Request Submitted Successfully</h3>
          <p className="text-green-700 mb-4">
            Your withdrawal request for ${parseFloat(amount).toLocaleString()} has been successfully submitted.
          </p>
          
          <div className="bg-white p-4 rounded border border-green-200 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600">Method</p>
                <p className="font-bold text-green-900 capitalize">{method.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-green-600">Status</p>
                <p className="font-bold text-green-900">
                  {isAccountRestricted ? 'Pending Review' : 'Pending Approval'}
                </p>
              </div>
              <div>
                <p className="text-green-600">Processing Time</p>
                <p className="font-bold text-green-900">
                  {method === 'bank' ? '1-3 business days' : 
                   method === 'crypto' ? '30 minutes - 2 hours' : 
                   '3-5 business days'}
                </p>
              </div>
              <div>
                <p className="text-green-600">Net Amount</p>
                <p className="font-bold text-green-900">${(parseFloat(amount) * 0.85).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <Button variant="outline" onClick={handleReset}>
            Submit Another Request
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ArrowDownRight size={20} className="mr-2" />
          Request Withdrawal
        </h3>
        <div className="text-sm text-gray-600">
          Available: <span className="font-semibold">${currentBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Account Status Warning */}
      {isAccountRestricted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-amber-800 font-semibold">Manual Review Required</h4>
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {stepNum}
            </div>
            <div className="ml-2 text-sm">
              {stepNum === 1 && 'Amount'}
              {stepNum === 2 && 'Method'}
              {stepNum === 3 && 'Confirm'}
            </div>
            {stepNum < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-4"></div>}
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
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  ${quickAmount.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(currentBalance.toString())}
                className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              >
                Max: ${currentBalance.toLocaleString()}
              </button>
            </div>

            {/* Commission Preview */}
            {previewAmount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Calculator size={16} className="mr-2" />
                  Transaction Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Withdrawal Amount:</span>
                    <span className="font-medium">${previewAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Commission (15%):</span>
                    <span className="font-medium text-red-600">-${commissionPreview.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Net Amount to Receive:</span>
                    <span className="font-bold text-green-600">${netAmount.toLocaleString()}</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Withdrawal Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    method === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building size={24} className="mx-auto mb-2 text-gray-600" />
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-xs text-gray-500">1-3 business days</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setMethod('crypto')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    method === 'crypto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Bitcoin size={24} className="mx-auto mb-2 text-gray-600" />
                  <p className="font-medium">Crypto Wallet</p>
                  <p className="text-xs text-gray-500">30 min - 2 hours</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setMethod('credit_card')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    method === 'credit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={24} className="mx-auto mb-2 text-gray-600" />
                  <p className="font-medium">Credit Card</p>
                  <p className="text-xs text-gray-500">3-5 business days</p>
                </button>
              </div>
            </div>

            {/* Bank Transfer Options */}
            {method === 'bank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Bank ({investorCountry})
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose your bank...</option>
                    {availableBanks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Banks available for {investorCountry}. If your bank is not listed, contact support.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Bank Transfer Information</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Processing time: 1-3 business days</li>
                    <li>• Funds will be transferred to your registered bank account</li>
                    <li>• Bank fees may apply depending on your institution</li>
                    <li>• International transfers may take longer</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Crypto Options */}
            {method === 'crypto' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cryptocurrency
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['BTC', 'ETH', 'XRP', 'USDT'] as CryptoType[]).map(crypto => (
                      <button
                        key={crypto}
                        type="button"
                        onClick={() => setSelectedCrypto(crypto)}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedCrypto === crypto ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">{crypto}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCrypto === 'USDT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select USDT Network
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['TRC20', 'ERC20', 'BEP20'] as USDTNetwork[]).map(network => (
                        <button
                          key={network}
                          type="button"
                          onClick={() => setSelectedNetwork(network)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            selectedNetwork === network ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium">{network}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedCrypto} Wallet Address
                    {selectedCrypto === 'USDT' && ` (${selectedNetwork})`}
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter your ${selectedCrypto} wallet address`}
                  />
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2">Crypto Withdrawal Information</h4>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• Processing time: 30 minutes to 2 hours</li>
                    <li>• Network fees will be deducted from your withdrawal</li>
                    <li>• Double-check your wallet address - transactions cannot be reversed</li>
                    <li>• Minimum withdrawal amounts may apply per cryptocurrency</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Credit Card Options */}
            {method === 'credit_card' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={creditCardData.number}
                      onChange={(e) => setCreditCardData({...creditCardData, number: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={creditCardData.name}
                      onChange={(e) => setCreditCardData({...creditCardData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={creditCardData.expiry}
                      onChange={(e) => setCreditCardData({...creditCardData, expiry: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={creditCardData.cvv}
                      onChange={(e) => setCreditCardData({...creditCardData, cvv: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">Credit Card Withdrawal Information</h4>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>• Processing time: 3-5 business days</li>
                    <li>• Funds will be credited back to your original payment card</li>
                    <li>• Additional verification may be required</li>
                    <li>• Credit card fees may apply depending on your card issuer</li>
                    <li>• Withdrawals can only be made to cards used for deposits</li>
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
              <h4 className="font-semibold text-gray-800 mb-4">Withdrawal Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                </div>
                {method === 'bank' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{selectedBank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="font-medium">{investorCountry}</span>
                    </div>
                  </>
                )}
                {method === 'crypto' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cryptocurrency:</span>
                      <span className="font-medium">{selectedCrypto}</span>
                    </div>
                    {selectedCrypto === 'USDT' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network:</span>
                        <span className="font-medium">{selectedNetwork}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet:</span>
                      <span className="font-medium text-xs">{walletAddress.slice(0, 10)}...{walletAddress.slice(-10)}</span>
                    </div>
                  </>
                )}
                {method === 'credit_card' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card:</span>
                    <span className="font-medium">****{creditCardData.number.slice(-4)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission (15%):</span>
                    <span className="font-medium text-red-600">-${commissionPreview.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Net Amount:</span>
                    <span className="font-bold text-green-600">${netAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Clock size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Processing Time</h4>
                  <p className="text-blue-700 text-sm">
                    {method === 'bank' && 'Your withdrawal will be processed within 1-3 business days.'}
                    {method === 'crypto' && 'Your withdrawal will be processed within 30 minutes to 2 hours.'}
                    {method === 'credit_card' && 'Your withdrawal will be processed within 3-5 business days.'}
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
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
          >
            Previous
          </Button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!amount || (step === 1 && !isStep1Valid)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
          >
            <ArrowDownRight size={16} className="mr-2" />
            Submit Withdrawal Request
          </Button>
        )}
      </div>
    </div>
  );
};

export default WithdrawalRequestForm;