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
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

export class FirestoreService {
  // Enhanced Investors methods with proper data handling
  static async getInvestors(): Promise<Investor[]> {
    try {
      console.log('🔥 Firestore: Querying investors collection...');
      const querySnapshot = await getDocs(collection(db, 'investors'));
      
      const investors = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 Processing investor document: ${doc.id}`);
        
        return {
          id: doc.id,
          ...data,
          // Ensure proper date handling
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          // Ensure required fields have defaults
          name: data.name || 'Unknown Investor',
          country: data.country || 'Unknown',
          joinDate: data.joinDate || new Date().toISOString().split('T')[0],
          initialDeposit: data.initialDeposit || 0,
          currentBalance: data.currentBalance || 0,
          role: 'investor' as const,
          isActive: data.isActive !== false,
          accountStatus: data.accountStatus || 'Active'
        };
      }) as Investor[];
      
      console.log(`✅ Firestore: Successfully processed ${investors.length} investor records`);
      return investors;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investors:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getInvestorById(id: string): Promise<Investor | null> {
    try {
      console.log(`🔥 Firestore: Fetching investor by ID: ${id}`);
      const docRef = doc(db, 'investors', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ Firestore: Found investor: ${data.name || 'Unknown'}`);
        
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          // Ensure required fields
          name: data.name || 'Unknown Investor',
          country: data.country || 'Unknown',
          joinDate: data.joinDate || new Date().toISOString().split('T')[0],
          initialDeposit: data.initialDeposit || 0,
          currentBalance: data.currentBalance || 0,
          role: 'investor' as const,
          isActive: data.isActive !== false,
          accountStatus: data.accountStatus || 'Active'
        } as Investor;
      }
      
      console.log(`⚠️ Firestore: No investor found with ID: ${id}`);
      return null;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investor by ID:', error);
      throw new Error(`Failed to retrieve investor profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createInvestor(id: string, data: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Creating investor profile: ${data.name || 'Unknown'}`);
      const docRef = doc(db, 'investors', id);
      
      const investorData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ensure required fields
        role: 'investor',
        isActive: true,
        accountStatus: data.accountStatus || 'Active'
      };
      
      await setDoc(docRef, investorData);
      console.log(`✅ Firestore: Successfully created investor profile: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to create investor:', error);
      throw new Error(`Failed to create investor profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateInvestor(id: string, data: Partial<Investor>): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating investor: ${id}`);
      const docRef = doc(db, 'investors', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully updated investor: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update investor:', error);
      throw new Error(`Failed to update investor profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateInvestorBalance(id: string, newBalance: number): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating balance for investor ${id}: $${newBalance.toLocaleString()}`);
      const docRef = doc(db, 'investors', id);
      await updateDoc(docRef, {
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully updated balance for investor: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update investor balance:', error);
      throw new Error(`Failed to update account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addCreditToInvestor(investorId: string, amount: number, adminId: string): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding $${amount.toLocaleString()} credit to investor: ${investorId}`);
      
      // Get current investor data
      const investor = await this.getInvestorById(investorId);
      if (!investor) {
        throw new Error('Investor profile not found');
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
      
      console.log(`✅ Firestore: Successfully added credit to investor: ${investorId}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add credit to investor:', error);
      throw new Error(`Failed to add credit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Transactions methods
  static async getTransactions(investorId?: string): Promise<Transaction[]> {
    try {
      console.log('🔥 Firestore: Querying transactions collection...');
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
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          // Ensure required fields
          type: data.type || 'Deposit',
          amount: data.amount || 0,
          status: data.status || 'Completed',
          date: data.date || new Date().toISOString().split('T')[0]
        };
      }) as Transaction[];
      
      console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch transactions:', error);
      throw new Error(`Failed to load transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding ${transaction.type} transaction: $${transaction.amount.toLocaleString()}`);
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added transaction`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add transaction:', error);
      throw new Error(`Failed to record transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Withdrawal Requests methods
  static async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      console.log('🔥 Firestore: Querying withdrawal requests collection...');
      const q = query(
        collection(db, 'withdrawalRequests'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate() || null,
          // Ensure required fields
          status: data.status || 'Pending',
          amount: data.amount || 0,
          date: data.date || new Date().toISOString().split('T')[0]
        };
      }) as WithdrawalRequest[];
      
      console.log(`✅ Firestore: Successfully retrieved ${requests.length} withdrawal requests`);
      return requests;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch withdrawal requests:', error);
      throw new Error(`Failed to load withdrawal requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addWithdrawalRequest(investorId: string, investorName: string, amount: number): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding withdrawal request: ${investorName} - $${amount.toLocaleString()}`);
      await addDoc(collection(db, 'withdrawalRequests'), {
        investorId,
        investorName,
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added withdrawal request`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add withdrawal request:', error);
      throw new Error(`Failed to submit withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateWithdrawalRequest(
    id: string, 
    status: string, 
    processedBy: string, 
    reason?: string
  ): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating withdrawal request ${id} to ${status}`);
      const docRef = doc(db, 'withdrawalRequests', id);
      await updateDoc(docRef, {
        status,
        processedBy,
        processedAt: serverTimestamp(),
        reason: reason || null,
        updatedAt: serverTimestamp()
      });

      // If approved, create commission record
      if (status === 'Approved') {
        const requestDoc = await getDoc(docRef);
        if (requestDoc.exists()) {
          const requestData = requestDoc.data();
          await this.addCommission({
            investorId: requestData.investorId,
            investorName: requestData.investorName,
            withdrawalAmount: requestData.amount,
            commissionRate: 15,
            commissionAmount: requestData.amount * 0.15,
            date: new Date().toISOString().split('T')[0],
            status: 'Earned',
            withdrawalId: id
          });
          console.log(`✅ Firestore: Created commission record for withdrawal: ${id}`);
        }
      }
      
      console.log(`✅ Firestore: Successfully updated withdrawal request: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update withdrawal request:', error);
      throw new Error(`Failed to process withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Commissions methods
  static async getCommissions(): Promise<any[]> {
    try {
      console.log('🔥 Firestore: Querying commissions collection...');
      const q = query(
        collection(db, 'commissions'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const commissions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          // Ensure required fields
          commissionAmount: data.commissionAmount || 0,
          commissionRate: data.commissionRate || 15,
          status: data.status || 'Earned'
        };
      });
      
      console.log(`✅ Firestore: Successfully retrieved ${commissions.length} commission records`);
      return commissions;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch commissions:', error);
      throw new Error(`Failed to load commission data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addCommission(commission: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding commission: $${commission.commissionAmount.toLocaleString()}`);
      await addDoc(collection(db, 'commissions'), {
        ...commission,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added commission record`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add commission:', error);
      throw new Error(`Failed to record commission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addCommissionWithdrawalRequest(request: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding commission withdrawal request: $${request.amount.toLocaleString()}`);
      await addDoc(collection(db, 'commissionWithdrawals'), {
        ...request,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added commission withdrawal request`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add commission withdrawal request:', error);
      throw new Error(`Failed to submit commission withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility methods
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      console.log(`🔥 Firestore: Deleting document from ${collectionName}: ${id}`);
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.log(`✅ Firestore: Successfully deleted document: ${id}`);
    } catch (error) {
      console.error(`❌ Firestore Error: Failed to delete document from ${collectionName}:`, error);
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDocumentCount(collectionName: string): Promise<number> {
    try {
      console.log(`🔥 Firestore: Counting documents in ${collectionName}...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      const count = querySnapshot.size;
      console.log(`✅ Firestore: Found ${count} documents in ${collectionName}`);
      return count;
    } catch (error) {
      console.error(`❌ Firestore Error: Failed to count documents in ${collectionName}:`, error);
      throw new Error(`Failed to count records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search and filtering methods
  static async searchInvestors(searchTerm: string): Promise<Investor[]> {
    try {
      console.log(`🔥 Firestore: Searching investors for term: "${searchTerm}"`);
      const investors = await this.getInvestors();
      const filtered = investors.filter(investor => 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`✅ Firestore: Found ${filtered.length} matching investors`);
      return filtered;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to search investors:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getInvestorsByStatus(status: string): Promise<Investor[]> {
    try {
      console.log(`🔥 Firestore: Fetching investors with status: ${status}`);
      const q = query(
        collection(db, 'investors'),
        where('accountStatus', '==', status)
      );
      
      const querySnapshot = await getDocs(q);
      const investors = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Investor[];
      
      console.log(`✅ Firestore: Found ${investors.length} investors with status: ${status}`);
      return investors;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investors by status:', error);
      throw new Error(`Failed to filter by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analytics helpers
  static async getTotalInvestorBalance(): Promise<number> {
    try {
      console.log('🔥 Firestore: Calculating total investor balance...');
      const investors = await this.getInvestors();
      const total = investors.reduce((total, investor) => total + investor.currentBalance, 0);
      console.log(`✅ Firestore: Total AUM: $${total.toLocaleString()}`);
      return total;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to calculate total investor balance:', error);
      throw new Error(`Failed to calculate total balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getRecentTransactions(limitCount: number = 10): Promise<Transaction[]> {
    try {
      console.log(`🔥 Firestore: Fetching ${limitCount} most recent transactions...`);
      const q = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Transaction[];
      
      console.log(`✅ Firestore: Retrieved ${transactions.length} recent transactions`);
      return transactions;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch recent transactions:', error);
      throw new Error(`Failed to load recent transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}