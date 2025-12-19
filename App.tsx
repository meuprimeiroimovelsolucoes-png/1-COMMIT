
import React, { useState, useEffect } from 'react';
import { View, User } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Remarketing } from './components/Remarketing';
import { Crm } from './components/Crm';
import { Calculator } from './components/Calculator';
import { SocialMedia } from './components/SocialMedia';
import { ContentRepo } from './components/ContentRepo';
import { Management } from './components/Management';
import { initializationError } from './services/firebase';
import { Loader2, AlertTriangle, Settings } from 'lucide-react';

const App: React.FC = () => {
  // Definimos um usuário padrão com acesso total (admin) para remover a necessidade de login
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'public_access',
    name: 'Acesso Livre',
    email: 'admin@meuprimeiroimovel.com',
    role: 'admin',
    avatar: 'AL'
  });
  
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(false); // Carregamento imediato

  const handleLogout = () => {
    // Como o acesso é livre, o "Sair" apenas reseta a visão para o Dashboard
    setView(View.DASHBOARD);
  };

  // TELA DE ERRO DE CONFIGURAÇÃO (Mantida caso as chaves do Firebase falhem no Firestore)
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Configuração Necessária</h2>
          <p className="text-slate-500 mb-6">
            O sistema não conseguiu conectar ao Firebase. Isso geralmente ocorre porque as chaves de API não foram configuradas corretamente ou o projeto não existe.
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
              <li>Verifique se o seu projeto no Firebase está ativo.</li>
              <li>Acesse o arquivo <code>services/firebase.ts</code> e atualize as chaves.</li>
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
          <p className="text-slate-500 font-medium">Carregando Meu primeiro imóvel...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard setView={setView} user={currentUser} />;
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
        return <Dashboard setView={setView} user={currentUser} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        currentUser={currentUser!}
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
