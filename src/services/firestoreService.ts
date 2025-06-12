import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

export class FirestoreService {
  // Investors
  static async getInvestors(): Promise<Investor[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'investors'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Investor[];
    } catch (error) {
      console.error('Error fetching investors:', error);
      throw error;
    }
  }

  static async getInvestorById(id: string): Promise<Investor | null> {
    try {
      const docRef = doc(db, 'investors', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Investor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching investor:', error);
      throw error;
    }
  }

  static async createInvestor(id: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, 'investors', id);
      await updateDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      // If document doesn't exist, create it
      const docRef = doc(db, 'investors', id);
      await updateDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(async () => {
        await addDoc(collection(db, 'investors'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    }
  }

  static async updateInvestor(id: string, data: Partial<Investor>): Promise<void> {
    try {
      const docRef = doc(db, 'investors', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating investor:', error);
      throw error;
    }
  }

  static async updateInvestorBalance(id: string, newBalance: number): Promise<void> {
    try {
      const docRef = doc(db, 'investors', id);
      await updateDoc(docRef, {
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating investor balance:', error);
      throw error;
    }
  }

  static async addCreditToInvestor(investorId: string, amount: number, adminId: string): Promise<void> {
    try {
      // Get current investor data
      const investor = await this.getInvestorById(investorId);
      if (!investor) {
        throw new Error('Investor not found');
      }

      // Update balance
      const newBalance = investor.currentBalance + amount;
      await this.updateInvestorBalance(investorId, newBalance);

      // Add transaction record
      await this.addTransaction({
        investorId,
        type: 'Credit',
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: `Credit added by admin ${adminId}`
      });
    } catch (error) {
      console.error('Error adding credit to investor:', error);
      throw error;
    }
  }

  // Transactions
  static async getTransactions(investorId?: string): Promise<Transaction[]> {
    try {
      let q;
      if (investorId) {
        q = query(
          collection(db, 'transactions'),
          where('investorId', '==', investorId),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          collection(db, 'transactions'),
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  static async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  // Withdrawal Requests
  static async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      throw error;
    }
  }

  static async updateWithdrawalRequest(
    id: string, 
    status: string, 
    processedBy: string, 
    reason?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'withdrawalRequests', id);
      await updateDoc(docRef, {
        status,
        processedBy,
        processedAt: serverTimestamp(),
        reason: reason || null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      throw error;
    }
  }

  // Commissions
  static async getCommissions(): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'commissions'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }
  }

  static async addCommissionWithdrawalRequest(request: any): Promise<void> {
    try {
      await addDoc(collection(db, 'commissionWithdrawals'), {
        ...request,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding commission withdrawal request:', error);
      throw error;
    }
  }

  // Utility methods
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  static async getDocumentCount(collectionName: string): Promise<number> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.size;
    } catch (error) {
      console.error(`Error getting document count for ${collectionName}:`, error);
      throw error;
    }
  }

  // Search and filtering
  static async searchInvestors(searchTerm: string): Promise<Investor[]> {
    try {
      const investors = await this.getInvestors();
      return investors.filter(investor => 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching investors:', error);
      throw error;
    }
  }

  static async getInvestorsByStatus(status: string): Promise<Investor[]> {
    try {
      const q = query(
        collection(db, 'investors'),
        where('accountStatus', '==', status)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Investor[];
    } catch (error) {
      console.error('Error fetching investors by status:', error);
      throw error;
    }
  }

  // Analytics helpers
  static async getTotalInvestorBalance(): Promise<number> {
    try {
      const investors = await this.getInvestors();
      return investors.reduce((total, investor) => total + investor.currentBalance, 0);
    } catch (error) {
      console.error('Error calculating total investor balance:', error);
      throw error;
    }
  }

  static async getRecentTransactions(limitCount: number = 10): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }
}