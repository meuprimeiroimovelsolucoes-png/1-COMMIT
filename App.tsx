
import React, { useState, useEffect } from 'react';
import { View, User, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Remarketing } from './components/Remarketing';
import { Crm } from './components/Crm';
import { Calculator } from './components/Calculator';
import { SocialMedia } from './components/SocialMedia';
import { ContentRepo } from './components/ContentRepo';
import { Management } from './components/Management';
import { Login } from './components/Login';
import { auth, db, initializationError } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, AlertTriangle, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se houve erro na inicialização (ex: falta de chaves), não tenta autenticar
    if (initializationError || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Buscar dados adicionais do usuário no Firestore (Role, Nome, etc)
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: userData.role as UserRole || 'corretor', // Default to corretor
              avatar: userData.profilePhotoUrl || undefined,
              whatsapp: userData.phone || undefined
            });
          } else {
            // AUTO-CADASTRO: O usuário existe no Auth mas não no Firestore.
            // Criamos o documento agora para persistir os dados.
            const newUserProfile = {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Usuário',
              email: firebaseUser.email || '',
              role: 'corretor', // Todo novo usuário começa como corretor
              createdAt: new Date().toISOString(),
              phone: '',
              creci: ''
            };

            await setDoc(userDocRef, newUserProfile);

            setCurrentUser({
              id: firebaseUser.uid,
              ...newUserProfile
            } as User);
          }
        } catch (error) {
          console.error("Erro ao buscar/criar perfil do usuário:", error);
          // Fallback de emergência para não bloquear o login
           setCurrentUser({
              id: firebaseUser.uid,
              name: firebaseUser.email || 'Usuário',
              email: firebaseUser.email || '',
              role: 'corretor'
            });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setView(View.DASHBOARD);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setCurrentUser(null);
      setView(View.DASHBOARD);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // TELA DE ERRO DE CONFIGURAÇÃO
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Configuração Necessária</h2>
          <p className="text-slate-500 mb-6">
            O sistema não conseguiu conectar ao Firebase. Isso geralmente ocorre porque as chaves de API não foram configuradas.
          </p>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left text-sm font-mono text-slate-600 mb-6 overflow-x-auto">
            <p className="font-bold text-slate-400 uppercase text-xs mb-2">Erro Técnico:</p>
            {initializationError}
          </div>

          <div className="space-y-3 text-left text-sm text-slate-600 bg-blue-50 p-4 rounded-lg">
            <p className="font-bold text-blue-800 flex items-center gap-2">
              <Settings size={16} /> Como resolver:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crie um projeto no <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">Firebase Console</a>.</li>
              <li>Ative o <strong>Authentication</strong> (Email/Senha) e o <strong>Firestore</strong>.</li>
              <li>Copie as configurações do projeto.</li>
              <li>Adicione as variáveis de ambiente no seu arquivo <code>.env</code> ou painel da Vercel (ex: <code>NEXT_PUBLIC_FIREBASE_API_KEY</code>).</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Carregando ImobMaster...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard setView={setView} />;
      case View.REMARKETING:
        return <Remarketing user={currentUser} />;
      case View.CRM:
        return <Crm user={currentUser} />;
      case View.CALCULATOR:
        return <Calculator />;
      case View.SOCIAL:
        return <SocialMedia user={currentUser} />;
      case View.CONTENT:
        return <ContentRepo user={currentUser} />;
      case View.MANAGEMENT:
        return <Management />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
