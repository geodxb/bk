import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

// Hook for investors data with enhanced Firebase integration and real-time updates
export const useInvestors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching all investors from Firestore...');
      
      const data = await FirestoreService.getInvestors();
      console.log('✅ Firebase: Successfully retrieved', data.length, 'investor profiles');
      
      // Log investor details for debugging
      data.forEach(investor => {
        console.log(`📊 Investor: ${investor.name} | Status: ${investor.accountStatus || 'Active'} | Balance: $${investor.currentBalance?.toLocaleString() || '0'}`);
      });
      
      setInvestors(data);
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch investors:', err);
      setError(`Failed to load investor data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for investors...');
    const unsubscribe = FirestoreService.subscribeToInvestors((updatedInvestors) => {
      console.log('🔄 Real-time update: Received', updatedInvestors.length, 'investors');
      setInvestors(updatedInvestors);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener');
      unsubscribe();
    };
  }, []);

  return { investors, loading, error, refetch: fetchInvestors };
};

// Hook for transactions data with enhanced Firebase integration
export const useTransactions = (investorId?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching transactions...', investorId ? `for investor ${investorId}` : 'all transactions');
      
      const data = await FirestoreService.getTransactions(investorId);
      console.log('✅ Firebase: Successfully retrieved', data.length, 'transactions');
      
      // Log transaction summary for debugging
      if (data.length > 0) {
        const deposits = data.filter(tx => tx.type === 'Deposit').length;
        const withdrawals = data.filter(tx => tx.type === 'Withdrawal').length;
        const earnings = data.filter(tx => tx.type === 'Earnings').length;
        console.log(`📈 Transaction Summary: ${deposits} deposits, ${withdrawals} withdrawals, ${earnings} earnings`);
      }
      
      setTransactions(data);
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch transactions:', err);
      setError(`Failed to load transaction data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [investorId]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

// Hook for withdrawal requests data with enhanced Firebase integration
export const useWithdrawalRequests = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching withdrawal requests...');
      
      const data = await FirestoreService.getWithdrawalRequests();
      console.log('✅ Firebase: Successfully retrieved', data.length, 'withdrawal requests');
      
      // Log withdrawal request summary for debugging
      if (data.length > 0) {
        const pending = data.filter(req => req.status === 'Pending').length;
        const approved = data.filter(req => req.status === 'Approved').length;
        const rejected = data.filter(req => req.status === 'Rejected').length;
        console.log(`💰 Withdrawal Summary: ${pending} pending, ${approved} approved, ${rejected} rejected`);
      }
      
      setWithdrawalRequests(data);
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch withdrawal requests:', err);
      setError(`Failed to load withdrawal data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  return { withdrawalRequests, loading, error, refetch: fetchWithdrawalRequests };
};

// Hook for single investor data with enhanced Firebase integration
export const useInvestor = (investorId: string) => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestor = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching investor profile:', investorId);
      
      const data = await FirestoreService.getInvestorById(investorId);
      
      if (data) {
        console.log('✅ Firebase: Found investor profile:', data.name);
        console.log(`📊 Account Details: Status: ${data.accountStatus || 'Active'} | Balance: $${data.currentBalance?.toLocaleString() || '0'}`);
        setInvestor(data);
      } else {
        console.log('⚠️ Firebase: Investor profile not found for ID:', investorId);
        setError('Investor profile not found');
      }
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch investor:', err);
      setError(`Failed to load investor profile: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investorId) {
      fetchInvestor();
    }
  }, [investorId]);

  return { investor, loading, error, refetch: fetchInvestor };
};