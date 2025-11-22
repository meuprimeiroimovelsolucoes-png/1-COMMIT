
import React from 'react';
import { View, User } from '../types';
import { 
  LayoutDashboard, 
  MessageSquareMore, 
  CalendarCheck, 
  Calculator, 
  Share2, 
  Library,
  Building2,
  LogOut,
  BarChart3
} from 'lucide-react';

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, currentUser, onLogout }) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Visão Geral', icon: LayoutDashboard },
    { id: View.REMARKETING, label: 'Leads & Documentos', icon: MessageSquareMore },
    { id: View.CRM, label: 'Gestão & Vendas', icon: CalendarCheck },
    { id: View.CONTENT, label: 'Central de Conteúdo', icon: Library },
    { id: View.CALCULATOR, label: 'Calculadora', icon: Calculator },
    { id: View.SOCIAL, label: 'Social Media', icon: Share2 },
  ];

  // Admin specific items
  // Role check updated to match SQL values
  if (currentUser.role === 'gestor' || currentUser.role === 'admin') {
    navItems.splice(1, 0, { id: View.MANAGEMENT, label: 'Gestão (Admin)', icon: BarChart3 });
  }

  return (
    <div className="w-64 bg-blue-950 text-white h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl">
      <div className="p-6 border-b border-blue-900 flex items-center gap-3">
        <div className="p-2 bg-orange-500 rounded-lg">
          <Building2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">ImobMaster</h1>
          <p className="text-xs text-blue-200">Super App Corretor</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/20' 
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-900">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 transition-colors group relative"
          title="Clique para Sair / Trocar Usuário"
        >
          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold text-orange-500 border border-blue-700">
            {currentUser.avatar || 'U'}
          </div>
          <div className="text-sm text-left flex-1">
            <p className="font-medium text-white truncate">{currentUser.name.split(' ')[0]}</p>
            <p className="text-xs text-blue-300 truncate capitalize">{currentUser.role}</p>
          </div>
          <LogOut size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
};
