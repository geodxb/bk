import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Investor } from '../types/investor';
import { Transaction } from '../types/transaction';
import { WithdrawalRequest } from '../types/withdrawal';

export class FirestoreService {
  // Generic CRUD operations
  static async create(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`✅ Document created in ${collectionName}:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  static async update(collectionName: string, id: string, data: any) {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: Timestamp.now()
      });
      console.log(`✅ Document updated in ${collectionName}:`, id);
    } catch (error) {
      console.error(`❌ Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  static async delete(collectionName: string, id: string) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      console.log(`✅ Document deleted from ${collectionName}:`, id);
    } catch (error) {
      console.error(`❌ Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  static async getAll(collectionName: string) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Retrieved ${documents.length} documents from ${collectionName}`);
      return documents;
    } catch (error) {
      console.error(`❌ Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  static async getById(collectionName: string, id: string) {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log(`❌ No document found in ${collectionName} with id:`, id);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listeners
  static onSnapshot(collectionName: string, callback: (data: any[]) => void) {
    try {
      const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(documents);
      });
      return unsubscribe;
    } catch (error) {
      console.error(`❌ Error setting up listener for ${collectionName}:`, error);
      throw error;
    }
  }

  // Investor-specific operations
  static async createInvestor(investorData: Omit<Investor, 'id'>) {
    return this.create('investors', investorData);
  }

  static async updateInvestor(id: string, data: Partial<Investor>) {
    return this.update('investors', id, data);
  }

  static async deleteInvestor(id: string) {
    return this.delete('investors', id);
  }

  static async getInvestors() {
    return this.getAll('investors');
  }

  static async getInvestorById(id: string) {
    return this.getById('investors', id);
  }

  // Transaction-specific operations
  static async createTransaction(transactionData: Omit<Transaction, 'id'>) {
    return this.create('transactions', transactionData);
  }

  static async updateTransaction(id: string, data: Partial<Transaction>) {
    return this.update('transactions', id, data);
  }

  static async getTransactions() {
    return this.getAll('transactions');
  }

  static async getTransactionsByInvestor(investorId: string) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('investorId', '==', investorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return transactions;
    } catch (error) {
      console.error('❌ Error getting transactions by investor:', error);
      throw error;
    }
  }

  // Withdrawal request operations
  static async createWithdrawalRequest(requestData: Omit<WithdrawalRequest, 'id'>) {
    return this.create('withdrawalRequests', requestData);
  }

  static async updateWithdrawalRequest(id: string, data: Partial<WithdrawalRequest>) {
    return this.update('withdrawalRequests', id, data);
  }

  static async getWithdrawalRequests() {
    return this.getAll('withdrawalRequests');
  }

  static async getWithdrawalRequestsByInvestor(investorId: string) {
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        where('investorId', '==', investorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return requests;
    } catch (error) {
      console.error('❌ Error getting withdrawal requests by investor:', error);
      throw error;
    }
  }

  // Batch operations
  static async batchUpdate(updates: Array<{ collection: string; id: string; data: any }>) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ collection: collectionName, id, data }) => {
        const docRef = doc(db, collectionName, id);
        batch.update(docRef, {
          ...data,
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();
      console.log(`✅ Batch update completed for ${updates.length} documents`);
    } catch (error) {
      console.error('❌ Error in batch update:', error);
      throw error;
    }
  }
}