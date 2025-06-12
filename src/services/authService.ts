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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
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
      console.error('Sign in error:', error);
      throw error;
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
      
      return {
        id: firebaseUser.uid,
        ...userData
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
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
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
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
      console.error('Check user exists error:', error);
      return false;
    }
  }
}