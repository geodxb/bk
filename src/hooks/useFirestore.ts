import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

// Hook for investors data
export const useInvestors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('FirestoreService: Fetching investors from Interactive Brokers...');
      const data = await FirestoreService.getInvestors();
      console.log('Interactive Brokers: Found', data.length, 'investors');
      setInvestors(data);
    } catch (err) {
      console.error('Error fetching investors from Interactive Brokers:', err);
      setError('Failed to fetch investors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  return { investors, loading, error, refetch: fetchInvestors };
};

// Hook for transactions data
export const useTransactions = (investorId?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Interactive Brokers: Fetching transactions...', investorId ? `for investor ${investorId}` : 'all');
      const data = await FirestoreService.getTransactions(investorId);
      console.log('Interactive Brokers: Found', data.length, 'transactions');
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions from Interactive Brokers:', err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [investorId]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

// Hook for withdrawal requests data
export const useWithdrawalRequests = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Interactive Brokers: Fetching withdrawal requests...');
      const data = await FirestoreService.getWithdrawalRequests();
      console.log('Interactive Brokers: Found', data.length, 'withdrawal requests');
      setWithdrawalRequests(data);
    } catch (err) {
      console.error('Error fetching withdrawal requests from Interactive Brokers:', err);
      setError('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  return { withdrawalRequests, loading, error, refetch: fetchWithdrawalRequests };
};

// Hook for single investor data
export const useInvestor = (investorId: string) => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestor = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Interactive Brokers: Fetching investor:', investorId);
      const data = await FirestoreService.getInvestorById(investorId);
      console.log('Interactive Brokers: Found investor:', data?.name || 'Not found');
      setInvestor(data);
    } catch (err) {
      console.error('Error fetching investor from Interactive Brokers:', err);
      setError('Failed to fetch investor');
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