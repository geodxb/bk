import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types/user';

export class AuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<User | null> {
    try {
      console.log('🔐 Attempting Firebase authentication...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase auth successful, fetching user data...');
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User data found in Firestore:', userData.role);
        return {
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          profilePic: userData.profilePic,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };
      } else {
        console.log('⚠️ User document not found in Firestore, creating admin user...');
        try {
          // Create admin user document if it doesn't exist
          const adminData = {
            name: 'Cristian Rolando Dorao',
            email: firebaseUser.email,
            role: 'admin' as UserRole,
            profilePic: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), adminData);
          console.log('✅ Admin user document created');
          
          return {
            id: firebaseUser.uid,
            ...adminData
          };
        } catch (createError: any) {
          console.error('❌ Failed to create user document:', createError.message);
          
          if (createError.code === 'permission-denied' || createError.message?.includes('Missing or insufficient permissions')) {
            console.error('🚨 FIRESTORE PERMISSIONS ERROR:');
            console.error('📋 Cannot create user document due to missing Firestore rules.');
            console.error('📖 Please follow the instructions in FIRESTORE_RULES_DEPLOYMENT.md');
            console.error('🔗 Firebase Console: https://console.firebase.google.com/project/blackbull-4b009/firestore/rules');
            
            // Return fallback admin user for the specific admin email
            if (firebaseUser.email === 'crisdoraodxb@gmail.com') {
              console.log('🔧 Using fallback admin user data');
              return {
                id: firebaseUser.uid,
                name: 'Cristian Rolando Dorao',
                email: firebaseUser.email || '',
                role: 'admin' as UserRole,
                profilePic: '',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
          }
          
          throw createError;
        }
      }
    } catch (error: any) {
      console.error('❌ Firebase authentication error:', error);
      
      // Handle Firestore permission errors during sign in
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        console.error('🚨 FIRESTORE PERMISSIONS ERROR DURING SIGN IN:');
        console.error('📋 The Firestore security rules need to be deployed manually.');
        console.error('📖 Please follow the instructions in FIRESTORE_RULES_DEPLOYMENT.md');
        console.error('🔗 Firebase Console: https://console.firebase.google.com/project/blackbull-4b009/firestore/rules');
        throw new Error('Database permissions not configured. Please contact administrator.');
      }
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later');
      } else {
        throw new Error('Authentication failed. Please check your credentials');
      }
    }
  }

  // Sign up new user
  static async signUp(
    email: string, 
    password: string, 
    name: string, 
    role: UserRole,
    additionalData?: any
  ): Promise<User | null> {
    try {
      console.log('🔐 Creating new Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userData = {
        name,
        email,
        role,
        profilePic: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...additionalData
      };
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ User document created in Firestore');
      
      return {
        id: firebaseUser.uid,
        ...userData
      };
    } catch (error: any) {
      console.error('❌ Firebase signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else {
        throw new Error('Failed to create account. Please try again');
      }
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }

  // Get current user data
  static async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          profilePic: userData.profilePic,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Get current user error:', error.message);
      
      // Handle Firestore permission errors specifically
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        console.error('🚨 FIRESTORE PERMISSIONS ERROR:');
        console.error('📋 The Firestore security rules need to be deployed manually.');
        console.error('📖 Please follow the instructions in FIRESTORE_RULES_DEPLOYMENT.md');
        console.error('🔗 Firebase Console: https://console.firebase.google.com/project/blackbull-4b009/firestore/rules');
        
        // For now, return a basic user object to prevent app crash
        if (firebaseUser.email === 'crisdoraodxb@gmail.com') {
          console.log('🔧 Using fallback admin user data');
          return {
            id: firebaseUser.uid,
            name: 'Cristian Rolando Dorao',
            email: firebaseUser.email || '',
            role: 'admin' as UserRole,
            profilePic: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }
      
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log('🔄 Auth state changed: User logged in');
        try {
          const user = await this.getCurrentUser();
          callback(user);
        } catch (error: any) {
          console.error('❌ Error in auth state change:', error.message);
          // Still call callback with null to prevent hanging
          callback(null);
        }
      } else {
        console.log('🔄 Auth state changed: User logged out');
        callback(null);
      }
    });
  }

  // Check if user exists by email
  static async checkUserExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Check user exists error:', error);
      return false;
    }
  }
}