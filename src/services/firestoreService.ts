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
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

export class FirestoreService {
  // Enhanced Investors methods with proper user collection integration
  static async getInvestors(): Promise<Investor[]> {
    try {
      console.log('🔥 Firestore: Querying investors collection...');
      
      // First try to get from investors collection
      const investorsSnapshot = await getDocs(collection(db, 'investors'));
      
      if (!investorsSnapshot.empty) {
        console.log(`✅ Firestore: Found ${investorsSnapshot.size} investors in investors collection`);
        return this.processInvestorDocs(investorsSnapshot);
      }
      
      // If no investors found, check users collection for investor role users
      console.log('⚠️ Firestore: No investors collection found, checking users collection...');
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        console.log(`✅ Firestore: Found ${usersSnapshot.size} investor users, migrating to investors collection...`);
        const investors = await this.migrateUsersToInvestors(usersSnapshot);
        return investors;
      }
      
      // If still no data, create sample investors
      console.log('⚠️ Firestore: No investor data found. Creating sample data...');
      await this.createSampleInvestors();
      
      // Fetch again after creating sample data
      const newSnapshot = await getDocs(collection(db, 'investors'));
      return this.processInvestorDocs(newSnapshot);
      
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investors:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Migrate users with investor role to investors collection
  private static async migrateUsersToInvestors(usersSnapshot: any): Promise<Investor[]> {
    const investors: Investor[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      console.log(`🔄 Migrating user to investor: ${userData.name || userData.email}`);
      
      const investorData = {
        name: userData.name || userData.email || 'Unknown Investor',
        email: userData.email,
        phone: userData.phone || '',
        country: userData.country || 'Unknown',
        location: userData.location || '',
        joinDate: userData.createdAt ? userData.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        initialDeposit: userData.initialDeposit || 10000,
        currentBalance: userData.currentBalance || userData.initialDeposit || 10000,
        role: 'investor' as const,
        isActive: userData.isActive !== false,
        accountStatus: userData.accountStatus || 'Active',
        tradingData: userData.tradingData || {
          positionsPerDay: 3,
          pairs: ['EUR/USD', 'GBP/USD'],
          platform: 'IBKR',
          leverage: 100,
          currency: 'USD'
        },
        bankDetails: userData.bankDetails || {},
        verification: userData.verification || {},
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date()
      };
      
      // Create investor document
      await setDoc(doc(db, 'investors', userDoc.id), {
        ...investorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      investors.push({
        id: userDoc.id,
        ...investorData
      });
      
      console.log(`✅ Migrated investor: ${investorData.name}`);
    }
    
    return investors;
  }

  private static processInvestorDocs(querySnapshot: any): Investor[] {
    const investors = querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      console.log(`📄 Processing investor document: ${doc.id} - ${data.name || 'Unknown'}`);
      
      return {
        id: doc.id,
        ...data,
        // Ensure proper date handling
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure required fields have defaults
        name: data.name || 'Unknown Investor',
        email: data.email || '',
        phone: data.phone || '',
        country: data.country || 'Unknown',
        location: data.location || '',
        joinDate: data.joinDate || new Date().toISOString().split('T')[0],
        initialDeposit: data.initialDeposit || 0,
        currentBalance: data.currentBalance || 0,
        role: 'investor' as const,
        isActive: data.isActive !== false,
        accountStatus: data.accountStatus || 'Active',
        tradingData: data.tradingData || {
          positionsPerDay: 0,
          pairs: [],
          platform: 'IBKR',
          leverage: 100,
          currency: 'USD'
        },
        bankDetails: data.bankDetails || {},
        verification: data.verification || {},
        accountFlags: data.accountFlags || {}
      };
    }) as Investor[];
    
    console.log(`✅ Firestore: Successfully processed ${investors.length} investor records`);
    
    // Log each investor for debugging
    investors.forEach(investor => {
      console.log(`👤 Investor: ${investor.name} | Balance: $${investor.currentBalance.toLocaleString()} | Status: ${investor.accountStatus} | Email: ${investor.email || 'N/A'}`);
    });
    
    return investors;
  }

  // Create comprehensive sample investors with all required data
  static async createSampleInvestors(): Promise<void> {
    console.log('🔥 Firestore: Creating comprehensive sample investor data...');
    
    const sampleInvestors = [
      {
        name: 'Omar Ehab Mohamed',
        email: 'omar.ehab@example.com',
        phone: '+20 123 456 7890',
        country: 'Egypt',
        location: 'Cairo',
        joinDate: '2024-01-15',
        initialDeposit: 25000,
        currentBalance: 32500,
        accountStatus: 'Active',
        tradingData: {
          positionsPerDay: 5,
          pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
          platform: 'IBKR',
          leverage: 100,
          currency: 'USD'
        },
        bankDetails: {
          accountHolderName: 'Omar Ehab Mohamed',
          bankName: 'National Bank of Egypt',
          accountNumber: '1234567890',
          swiftCode: 'NBEGEGCX',
          bankAddress: 'Cairo, Egypt',
          currency: 'USD'
        },
        verification: {
          idType: 'National ID Card',
          depositMethod: 'crypto',
          selectedCrypto: 'Bitcoin (BTC)'
        }
      },
      {
        name: 'Rodrigo Alfonso Martinez',
        email: 'rodrigo.martinez@example.com',
        phone: '+52 555 123 4567',
        country: 'Mexico',
        location: 'Mexico City',
        joinDate: '2024-02-20',
        initialDeposit: 15000,
        currentBalance: 18750,
        accountStatus: 'Active',
        tradingData: {
          positionsPerDay: 3,
          pairs: ['USD/MXN', 'EUR/USD'],
          platform: 'IBKR',
          leverage: 50,
          currency: 'USD'
        },
        bankDetails: {
          accountHolderName: 'Rodrigo Alfonso Martinez',
          bankName: 'Banco Santander México',
          accountNumber: '9876543210',
          swiftCode: 'BMSXMXMM',
          bankAddress: 'Mexico City, Mexico',
          currency: 'USD'
        },
        verification: {
          idType: 'Passport',
          depositMethod: 'crypto',
          selectedCrypto: 'Ethereum (ETH)'
        }
      },
      {
        name: 'Pablo Canales Rodriguez',
        email: 'pablo.canales@example.com',
        phone: '+52 444 987 6543',
        country: 'Mexico',
        location: 'Guadalajara',
        joinDate: '2024-03-10',
        initialDeposit: 50000,
        currentBalance: 47500,
        accountStatus: 'Restricted for withdrawals (policy violation)',
        accountFlags: {
          policyViolation: true,
          policyViolationMessage: 'Account flagged for suspicious trading patterns. Under compliance review.',
          withdrawalDisabled: true,
          withdrawalMessage: 'Withdrawals temporarily disabled pending investigation.'
        },
        tradingData: {
          positionsPerDay: 8,
          pairs: ['USD/MXN', 'EUR/USD', 'GBP/USD'],
          platform: 'IBKR',
          leverage: 200,
          currency: 'USD'
        },
        bankDetails: {
          accountHolderName: 'Pablo Canales Rodriguez',
          bankName: 'BBVA México',
          accountNumber: '5555666677',
          swiftCode: 'BCMRMXMM',
          bankAddress: 'Guadalajara, Mexico',
          currency: 'USD'
        },
        verification: {
          idType: 'Driver\'s License',
          depositMethod: 'bank',
          selectedCrypto: null
        }
      },
      {
        name: 'Haas Raphael Herreman',
        email: 'haas.herreman@example.com',
        phone: '+32 2 123 4567',
        country: 'Belgium',
        location: 'Brussels',
        joinDate: '2024-01-05',
        initialDeposit: 75000,
        currentBalance: 89250,
        accountStatus: 'Active',
        tradingData: {
          positionsPerDay: 12,
          pairs: ['EUR/USD', 'GBP/USD', 'USD/CHF'],
          platform: 'IBKR',
          leverage: 100,
          currency: 'EUR'
        },
        bankDetails: {
          accountHolderName: 'Haas Raphael Herreman',
          bankName: 'KBC Bank',
          accountNumber: 'BE68539007547034',
          swiftCode: 'KREDBEBB',
          bankAddress: 'Brussels, Belgium',
          currency: 'EUR'
        },
        verification: {
          idType: 'National ID Card',
          depositMethod: 'bank',
          selectedCrypto: null
        }
      },
      {
        name: 'Javier Francisco Lopez',
        email: 'javier.lopez@example.com',
        phone: '+52 333 555 7777',
        country: 'Mexico',
        location: 'Monterrey',
        joinDate: '2024-02-28',
        initialDeposit: 30000,
        currentBalance: 28500,
        accountStatus: 'Active',
        tradingData: {
          positionsPerDay: 4,
          pairs: ['USD/MXN', 'EUR/USD'],
          platform: 'IBKR',
          leverage: 75,
          currency: 'USD'
        },
        bankDetails: {
          accountHolderName: 'Javier Francisco Lopez',
          bankName: 'Banorte',
          accountNumber: '1122334455',
          swiftCode: 'MENOMXMT',
          bankAddress: 'Monterrey, Mexico',
          currency: 'USD'
        },
        verification: {
          idType: 'Passport',
          depositMethod: 'crypto',
          selectedCrypto: 'USDT (TRC20)'
        }
      },
      {
        name: 'Pamela Medina Santos',
        email: 'pamela.medina@example.com',
        phone: '+52 222 888 9999',
        country: 'Mexico',
        location: 'Puebla',
        joinDate: '2024-03-15',
        initialDeposit: 20000,
        currentBalance: 22400,
        accountStatus: 'Active',
        tradingData: {
          positionsPerDay: 2,
          pairs: ['USD/MXN'],
          platform: 'IBKR',
          leverage: 30,
          currency: 'USD'
        },
        bankDetails: {
          accountHolderName: 'Pamela Medina Santos',
          bankName: 'Banco Azteca',
          accountNumber: '7788990011',
          swiftCode: 'AZTEMXMT',
          bankAddress: 'Puebla, Mexico',
          currency: 'USD'
        },
        verification: {
          idType: 'National ID Card',
          depositMethod: 'bank',
          selectedCrypto: null
        }
      },
      {
        name: 'Patricia Perea Gonzalez',
        email: 'patricia.perea@example.com',
        phone: '+52 777 444 1111',
        country: 'Mexico',
        location: 'Cuernavaca',
        joinDate: '2024-01-25',
        initialDeposit: 40000,
        currentBalance: 45600,
        accountStatus: 'Closed - refund in progress',
        accountFlags: {
          withdrawalDisabled: false,
          withdrawalMessage: 'Account closed at client request. Final withdrawal processed.'
        },
        tradingData: {
          positionsPerDay: 6,
          pairs: ['USD/MXN', 'EUR/USD', 'GBP/USD'],
          platform: 'IBKR',
          leverage: 100,
          currency: 'USD'
        },
        bankDetails: {
          accountHolderName: 'Patricia Perea Gonzalez',
          bankName: 'Citibanamex',
          accountNumber: '3344556677',
          swiftCode: 'BNMXMXMM',
          bankAddress: 'Cuernavaca, Mexico',
          currency: 'USD'
        },
        verification: {
          idType: 'Driver\'s License',
          depositMethod: 'crypto',
          selectedCrypto: 'Bitcoin (BTC)'
        }
      }
    ];

    try {
      for (const investorData of sampleInvestors) {
        const investorId = `investor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create investor document with all data
        await setDoc(doc(db, 'investors', investorId), {
          ...investorData,
          role: 'investor',
          isActive: !investorData.accountStatus?.includes('Closed'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Create initial deposit transaction
        await addDoc(collection(db, 'transactions'), {
          investorId,
          type: 'Deposit',
          amount: investorData.initialDeposit,
          date: investorData.joinDate,
          status: 'Completed',
          description: `Initial deposit via ${investorData.verification.depositMethod === 'crypto' ? investorData.verification.selectedCrypto : 'bank transfer'}`,
          createdAt: serverTimestamp()
        });

        // Create earnings transactions if profitable
        if (investorData.currentBalance > investorData.initialDeposit) {
          const earnings = investorData.currentBalance - investorData.initialDeposit;
          const earningsDate = new Date(investorData.joinDate);
          earningsDate.setDate(earningsDate.getDate() + Math.floor(Math.random() * 30) + 7);
          
          await addDoc(collection(db, 'transactions'), {
            investorId,
            type: 'Earnings',
            amount: earnings,
            date: earningsDate.toISOString().split('T')[0],
            status: 'Completed',
            description: 'Trading profits from IBKR platform',
            createdAt: serverTimestamp()
          });
        }

        // Create withdrawal transactions for some investors
        if (Math.random() > 0.7 && investorData.currentBalance > 5000) {
          const withdrawalAmount = Math.floor(Math.random() * 5000) + 1000;
          const withdrawalDate = new Date();
          withdrawalDate.setDate(withdrawalDate.getDate() - Math.floor(Math.random() * 15));
          
          await addDoc(collection(db, 'transactions'), {
            investorId,
            type: 'Withdrawal',
            amount: -withdrawalAmount,
            date: withdrawalDate.toISOString().split('T')[0],
            status: 'Completed',
            description: 'Withdrawal to registered bank account',
            createdAt: serverTimestamp()
          });

          // Create withdrawal request record
          await addDoc(collection(db, 'withdrawalRequests'), {
            investorId,
            investorName: investorData.name,
            amount: withdrawalAmount,
            date: withdrawalDate.toISOString().split('T')[0],
            status: 'Approved',
            processedBy: 'admin_system',
            processedAt: serverTimestamp(),
            reason: 'Standard withdrawal request approved',
            createdAt: serverTimestamp()
          });

          // Create commission record
          await addDoc(collection(db, 'commissions'), {
            investorId,
            investorName: investorData.name,
            withdrawalAmount: withdrawalAmount,
            commissionRate: 15,
            commissionAmount: withdrawalAmount * 0.15,
            date: withdrawalDate.toISOString().split('T')[0],
            status: 'Earned',
            createdAt: serverTimestamp()
          });
        }

        console.log(`✅ Created comprehensive investor profile: ${investorData.name} (${investorData.email})`);
      }
      
      console.log('✅ Firestore: Comprehensive sample investor data created successfully');
    } catch (error) {
      console.error('❌ Firestore Error: Failed to create sample investors:', error);
      throw error;
    }
  }

  // Real-time listener for investors
  static subscribeToInvestors(callback: (investors: Investor[]) => void): () => void {
    console.log('🔥 Firestore: Setting up real-time listener for investors...');
    
    const unsubscribe = onSnapshot(
      collection(db, 'investors'),
      (querySnapshot) => {
        console.log('🔄 Firestore: Investors collection updated');
        const investors = this.processInvestorDocs(querySnapshot);
        callback(investors);
      },
      (error) => {
        console.error('❌ Firestore Error: Real-time listener failed:', error);
      }
    );

    return unsubscribe;
  }

  static async getInvestorById(id: string): Promise<Investor | null> {
    try {
      console.log(`🔥 Firestore: Fetching investor by ID: ${id}`);
      
      // First try investors collection
      let docRef = doc(db, 'investors', id);
      let docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ Firestore: Found investor in investors collection: ${data.name || 'Unknown'}`);
        
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          // Ensure required fields
          name: data.name || 'Unknown Investor',
          email: data.email || '',
          phone: data.phone || '',
          country: data.country || 'Unknown',
          location: data.location || '',
          joinDate: data.joinDate || new Date().toISOString().split('T')[0],
          initialDeposit: data.initialDeposit || 0,
          currentBalance: data.currentBalance || 0,
          role: 'investor' as const,
          isActive: data.isActive !== false,
          accountStatus: data.accountStatus || 'Active',
          tradingData: data.tradingData || {},
          bankDetails: data.bankDetails || {},
          verification: data.verification || {},
          accountFlags: data.accountFlags || {}
        } as Investor;
      }
      
      // If not found in investors, check users collection
      console.log(`⚠️ Firestore: Investor not found in investors collection, checking users collection...`);
      docRef = doc(db, 'users', id);
      docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role === 'investor') {
          console.log(`✅ Firestore: Found investor in users collection, migrating: ${userData.name || userData.email}`);
          
          // Migrate this user to investors collection
          const investorData = {
            name: userData.name || userData.email || 'Unknown Investor',
            email: userData.email || '',
            phone: userData.phone || '',
            country: userData.country || 'Unknown',
            location: userData.location || '',
            joinDate: userData.createdAt ? userData.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            initialDeposit: userData.initialDeposit || 10000,
            currentBalance: userData.currentBalance || userData.initialDeposit || 10000,
            role: 'investor' as const,
            isActive: userData.isActive !== false,
            accountStatus: userData.accountStatus || 'Active',
            tradingData: userData.tradingData || {},
            bankDetails: userData.bankDetails || {},
            verification: userData.verification || {},
            accountFlags: userData.accountFlags || {},
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: new Date()
          };
          
          // Create in investors collection
          await setDoc(doc(db, 'investors', id), {
            ...investorData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          return {
            id,
            ...investorData
          };
        }
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
        accountStatus: data.accountStatus || 'Active - Pending Verification',
        email: data.email || '',
        phone: data.phone || '',
        tradingData: data.tradingData || {},
        bankDetails: data.bankDetails || {},
        verification: data.verification || {},
        accountFlags: data.accountFlags || {}
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

  // Enhanced Transactions methods with fallback for missing index
  static async getTransactions(investorId?: string): Promise<Transaction[]> {
    try {
      console.log('🔥 Firestore: Querying transactions collection...');
      
      if (investorId) {
        // Try the optimized query first (requires composite index)
        try {
          console.log(`🔥 Firestore: Attempting optimized query for investor: ${investorId}`);
          const q = query(
            collection(db, 'transactions'),
            where('investorId', '==', investorId),
            orderBy('date', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const transactions = this.processTransactionDocs(querySnapshot);
          console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions using optimized query`);
          return transactions;
        } catch (indexError: any) {
          // If the composite index doesn't exist, fall back to filtering approach
          if (indexError.message?.includes('index') || indexError.code === 'failed-precondition') {
            console.log('⚠️ Firestore: Composite index not available, using fallback approach...');
            
            // First get all transactions for the investor (without ordering)
            const q = query(
              collection(db, 'transactions'),
              where('investorId', '==', investorId)
            );
            
            const querySnapshot = await getDocs(q);
            const transactions = this.processTransactionDocs(querySnapshot);
            
            // Sort in memory by date (descending)
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions using fallback approach`);
            return transactions;
          } else {
            // Re-throw if it's a different error
            throw indexError;
          }
        }
      } else {
        // For all transactions, try ordering by date
        try {
          const q = query(
            collection(db, 'transactions'),
            orderBy('date', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const transactions = this.processTransactionDocs(querySnapshot);
          console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions`);
          return transactions;
        } catch (indexError: any) {
          // If ordering fails, get all and sort in memory
          console.log('⚠️ Firestore: Date ordering not available, sorting in memory...');
          const querySnapshot = await getDocs(collection(db, 'transactions'));
          const transactions = this.processTransactionDocs(querySnapshot);
          
          // Sort in memory by date (descending)
          transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions with memory sorting`);
          return transactions;
        }
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch transactions:', error);
      throw new Error(`Failed to load transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static processTransactionDocs(querySnapshot: any): Transaction[] {
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Ensure required fields
        type: data.type || 'Deposit',
        amount: data.amount || 0,
        status: data.status || 'Completed',
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.description || ''
      };
    }) as Transaction[];
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
      
      try {
        // Try with ordering first
        const q = query(
          collection(db, 'withdrawalRequests'),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const requests = this.processWithdrawalDocs(querySnapshot);
        console.log(`✅ Firestore: Successfully retrieved ${requests.length} withdrawal requests`);
        return requests;
      } catch (indexError: any) {
        // If ordering fails, get all and sort in memory
        console.log('⚠️ Firestore: Date ordering not available for withdrawals, sorting in memory...');
        const querySnapshot = await getDocs(collection(db, 'withdrawalRequests'));
        const requests = this.processWithdrawalDocs(querySnapshot);
        
        // Sort in memory by date (descending)
        requests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`✅ Firestore: Successfully retrieved ${requests.length} withdrawal requests with memory sorting`);
        return requests;
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch withdrawal requests:', error);
      throw new Error(`Failed to load withdrawal requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static processWithdrawalDocs(querySnapshot: any): WithdrawalRequest[] {
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        processedAt: data.processedAt?.toDate() || null,
        // Ensure required fields
        status: data.status || 'Pending',
        amount: data.amount || 0,
        date: data.date || new Date().toISOString().split('T')[0],
        investorName: data.investorName || 'Unknown Investor'
      };
    }) as WithdrawalRequest[];
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
      
      try {
        // Try with ordering first
        const q = query(
          collection(db, 'commissions'),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const commissions = this.processCommissionDocs(querySnapshot);
        console.log(`✅ Firestore: Successfully retrieved ${commissions.length} commission records`);
        return commissions;
      } catch (indexError: any) {
        // If ordering fails, get all and sort in memory
        console.log('⚠️ Firestore: Date ordering not available for commissions, sorting in memory...');
        const querySnapshot = await getDocs(collection(db, 'commissions'));
        const commissions = this.processCommissionDocs(querySnapshot);
        
        // Sort in memory by date (descending)
        commissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`✅ Firestore: Successfully retrieved ${commissions.length} commission records with memory sorting`);
        return commissions;
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch commissions:', error);
      throw new Error(`Failed to load commission data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static processCommissionDocs(querySnapshot: any): any[] {
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Ensure required fields
        commissionAmount: data.commissionAmount || 0,
        commissionRate: data.commissionRate || 15,
        status: data.status || 'Earned',
        investorName: data.investorName || 'Unknown Investor'
      };
    });
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
      
      try {
        // Try with ordering and limit first
        const q = query(
          collection(db, 'transactions'),
          orderBy('date', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const transactions = this.processTransactionDocs(querySnapshot);
        console.log(`✅ Firestore: Retrieved ${transactions.length} recent transactions`);
        return transactions;
      } catch (indexError: any) {
        // If ordering fails, get all, sort in memory, and limit
        console.log('⚠️ Firestore: Date ordering not available, using fallback approach...');
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const transactions = this.processTransactionDocs(querySnapshot);
        
        // Sort in memory by date (descending) and limit
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const limitedTransactions = transactions.slice(0, limitCount);
        
        console.log(`✅ Firestore: Retrieved ${limitedTransactions.length} recent transactions with fallback approach`);
        return limitedTransactions;
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch recent transactions:', error);
      throw new Error(`Failed to load recent transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}