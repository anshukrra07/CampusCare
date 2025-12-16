// Test script to check Firestore connectivity
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBw0QlFNVCGkC-kt6N_OQo_ZEgywcXDkpw",
  authDomain: "campuscare-45120.firebaseapp.com",
  projectId: "campuscare-45120",
  storageBucket: "campuscare-45120.firebasestorage.app",
  messagingSenderId: "203254134459",
  appId: "1:203254134459:web:297c094ebb63641a565b9e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('Firebase initialized successfully');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);

// Test authentication
signInAnonymously(auth)
  .then((result) => {
    console.log('Anonymous authentication successful');
    console.log('User ID:', result.user.uid);
  })
  .catch((error) => {
    console.error('Authentication failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  });