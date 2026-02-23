import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Client-side Firebase config — these keys are designed to be public per Firebase docs.
// Security is enforced by Firestore Security Rules, not by keeping these keys secret.
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAOfLCpcP-Lq3QXUhrGNbeUdys-CsCPvrM',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'macha-demo.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'macha-demo',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'macha-demo.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '345709514301',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:345709514301:web:d1bbb63d8274a50cf42454',
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp());
  }
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp());
  }
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getApp());
  }
  return _storage;
}
