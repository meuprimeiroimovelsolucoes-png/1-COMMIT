
import React, { useState, useEffect, useMemo } from 'react';
import { View, User, Lead } from '../types';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { TrendingUp, Users, AlertCircle, ArrowRight, Loader2, DollarSign } from 'lucide-react';

interface DashboardProps {
  setView: (view: View) => void;
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView, user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const leadsRef = collection(db, 'leads');
    
    // Se for corretor, vê apenas o que é dele. Se for admin/gestor, vê tudo.
    let q = query(leadsRef);
    if (user.role === 'corretor') {
      q = query(leadsRef, where('assignedTo', '==', user.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(fetchedLeads);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar dashboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.id, user.role]);

  // Cálculos baseados em dados reais
  const stats = useMemo(() => {
    const soldLeads = leads.filter(l => l.status === 'vendido');
    const pendingLeadsCount = leads.filter(l => l.status === 'pendente' || l.status === 'novo').length;
    
    const vgvTotal = soldLeads.reduce((acc, lead) => acc + (lead.saleDetails?.propertyValue || 0), 0);
    const faturamentoMes = soldLeads.reduce((acc, lead) => acc + (lead.saleDetails?.invoiceValue || 0), 0);
    const pendingContracts = soldLeads.filter(l => l.saleDetails?.stage !== 'contrato_caixa_assinado').length;

    return {
      vgvTotal,
      faturamentoMes,
      pendingLeadsCount,
      pendingContracts,
      recentSales: soldLeads.sort((a, b) => 
        new Date(b.saleDetails?.saleDate || 0).getTime() - new Date(a.saleDetails?.saleDate || 0).getTime()
      ).slice(0, 4)
    };
  }, [leads]);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando dados em tempo real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-blue-950">Olá, {user.name.split(' ')[0]}! 👋</h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Aqui está o resumo da sua operação imobiliária em tempo real.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Comissão Estimada (Líquida)</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.faturamentoMes)}</p>
        </div>
      </div>

      {/* KPIs Reais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group" onClick={() => setView(View.CRM)}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">VGV Total (Vendido)</p>
          <p className="text-2xl font-bold text-blue-950">
            {formatCurrency(stats.vgvTotal)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Soma do valor de todos os imóveis vendidos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group" onClick={() => setView(View.REMARKETING)}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            {stats.pendingLeadsCount > 0 && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse">Urgente</span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Leads Aguardando</p>
          <p className="text-2xl font-bold text-blue-950">{stats.pendingLeadsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Status: Novo ou Pendente</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group" onClick={() => setView(View.CRM)}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Fluxos em Aberto</p>
          <p className="text-2xl font-bold text-blue-950">{stats.pendingContracts}</p>
          <p className="text-xs text-slate-400 mt-1">Contratos pendentes de assinatura</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Últimas Vendas Registradas</h3>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <div className="space-y-4">
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div>
                  <p className="font-bold text-slate-700 text-sm line-clamp-1">{sale.saleDetails?.developmentName}</p>
                  <p className="text-xs text-slate-500">{sale.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-sm">
                    {formatCurrency(sale.saleDetails?.invoiceValue || 0)}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Comissão Bruta</p>
                </div>
              </div>
            ))}
            {stats.recentSales.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm italic">Nenhuma venda registrada ainda.</p>
              </div>
            )}
          </div>
          <button onClick={() => setView(View.CRM)} className="mt-4 w-full py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-blue-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
            Ver Gestão de Vendas <ArrowRight size={16} />
          </button>
        </div>

        <div className="bg-blue-950 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
          
          <div className="relative z-10">
            <h3 className="font-bold text-2xl mb-2">Simulador de Crédito</h3>
            <p className="text-blue-200 text-sm mb-8 leading-relaxed">
              Realize simulações rápidas do **Minha Casa Minha Vida** ou **SBPE** diretamente com o cliente e descubra o potencial de compra.
            </p>
            
            <button 
              onClick={() => setView(View.CALCULATOR)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl w-full transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 group"
            >
              <span>Abrir Calculadora Financeira</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
