import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

// Configuração direta extraída do seu projeto Firebase (imobmaster-f66c7)
const firebaseConfig = {
  apiKey: "AIzaSyB7U5JRA6_IrTWF4SJkAhzemI81BNpEEKk",
  authDomain: "imobmaster-f66c7.firebaseapp.com",
  projectId: "imobmaster-f66c7",
  storageBucket: "imobmaster-f66c7.firebasestorage.app",
  messagingSenderId: "762265890552",
  appId: "1:762265890552:web:d15b65326f7db27f84d50d",
  measurementId: "G-9RZ9RCDKB0"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let initializationError: string | null = null;

try {
  // Inicializa o Firebase (singleton para evitar recriação em hot-reload)
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
} catch (error: any) {
  console.error("Erro ao inicializar Firebase:", error);
  initializationError = error.message || "Erro desconhecido na inicialização do Firebase.";
}

export { auth, db, storage, functions, initializationError };