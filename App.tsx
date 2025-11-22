
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
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            // Fallback se o usuário existir no Auth mas não no Firestore (ex: criado manualmente no console)
            setCurrentUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: 'corretor',
              avatar: undefined
            });
          }
        } catch (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    // O Auth Listener cuidará do estado, mas podemos forçar a view aqui
    setView(View.DASHBOARD);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setView(View.DASHBOARD);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

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
        return <Crm />;
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
