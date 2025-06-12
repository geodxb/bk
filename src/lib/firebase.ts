import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
console.log('🔥 Initializing Firebase with project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable network persistence for offline support
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Connection status monitoring
let isOnline = true;

const monitorConnection = () => {
  window.addEventListener('online', async () => {
    if (!isOnline) {
      console.log('🌐 Network restored, enabling Firestore...');
      try {
        await enableNetwork(db);
        isOnline = true;
        console.log('✅ Firestore network enabled');
      } catch (error) {
        console.error('❌ Failed to enable Firestore network:', error);
      }
    }
  });

  window.addEventListener('offline', async () => {
    if (isOnline) {
      console.log('📴 Network lost, disabling Firestore...');
      try {
        await disableNetwork(db);
        isOnline = false;
        console.log('✅ Firestore network disabled');
      } catch (error) {
        console.error('❌ Failed to disable Firestore network:', error);
      }
    }
  });
};

// Start monitoring connection
monitorConnection();

console.log('✅ Firebase initialized successfully');
console.log('🔐 Auth domain:', firebaseConfig.authDomain);
console.log('🗄️ Firestore project:', firebaseConfig.projectId);

export default app;