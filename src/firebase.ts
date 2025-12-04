// Firebase Configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com/ > Your Project > Project Settings > General > Your apps

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ REPLACE THIS CONFIG OBJECT WITH YOUR FIREBASE CREDENTIALS ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyADSweuWtJo3UWMTa7JHYL_ybDbk4R8xmE",
    authDomain: "the-social-network-c8d26.firebaseapp.com",
    projectId: "the-social-network-c8d26",
    storageBucket: "the-social-network-c8d26.firebasestorage.app",
    messagingSenderId: "305126150786",
    appId: "1:305126150786:web:28ac7674b2aa4664b29a9b",
    measurementId: "G-MVMRF2R4MH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;

