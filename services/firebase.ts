import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

// Helper para acessar variáveis de ambiente de forma segura em diferentes ambientes
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    return '';
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('NEXT_PUBLIC_FIREBASE_APP_ID')
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let initializationError: string | null = null;

try {
  // Validação simples para evitar crash do initializeApp se as chaves estiverem vazias
  // Isso permite que o App.tsx renderize a tela de erro amigável em vez de travar
  if (!firebaseConfig.apiKey) {
    throw new Error("As chaves de API do Firebase não foram encontradas nas variáveis de ambiente.");
  }

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
} catch (error: any) {
  console.error("Erro ao inicializar Firebase:", error);
  initializationError = error.message || "Erro desconhecido na inicialização do Firebase.";
}

// Exportamos as variáveis. Se a inicialização falhar, elas serão undefined,
// mas o App.tsx verificará 'initializationError' antes de tentar usá-las.
export { auth, db, storage, functions, initializationError };