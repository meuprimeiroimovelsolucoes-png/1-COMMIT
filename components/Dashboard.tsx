import React from 'react';
import { View } from '../types';
import { MOCK_SALES, MOCK_LEADS } from '../constants';
import { TrendingUp, Users, AlertCircle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  setView: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const totalSales = MOCK_SALES.reduce((acc, sale) => acc + sale.value, 0);
  const pendingLeads = MOCK_LEADS.filter(l => l.status === 'pendente').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-blue-950">Olá, João! 👋</h2>
          <p className="text-slate-500 mt-1">Aqui está o resumo da sua operação imobiliária hoje.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Faturamento Mês</p>
          <p className="text-2xl font-bold text-green-600">R$ 18.500,00</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer" onClick={() => setView(View.CRM)}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">VGV Total (Em Andamento)</p>
          <p className="text-2xl font-bold text-blue-950">
            {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer" onClick={() => setView(View.REMARKETING)}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Users size={24} />
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Ação Necessária</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Leads Pendentes</p>
          <p className="text-2xl font-bold text-blue-950">{pendingLeads}</p>
          <p className="text-xs text-slate-400 mt-1">Reengajar via WhatsApp</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer" onClick={() => setView(View.CRM)}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Contratos Pendentes</p>
          <p className="text-2xl font-bold text-blue-950">1</p>
          <p className="text-xs text-slate-400 mt-1">Aguardando assinatura banco</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Últimas Vendas</h3>
          <div className="space-y-4">
            {MOCK_SALES.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div>
                  <p className="font-bold text-slate-700 text-sm">{sale.propertyName}</p>
                  <p className="text-xs text-slate-500">{sale.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-sm">
                    {(sale.value * 0.04 * 0.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase">Minha Comissão (Est.)</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setView(View.CRM)} className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-orange-600 font-medium flex items-center justify-center gap-1 transition-colors">
            Ver todas <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-blue-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <h3 className="font-bold text-xl mb-2">Calculadora Rápida</h3>
          <p className="text-blue-200 text-sm mb-6">Faça uma simulação de financiamento rápida durante o atendimento.</p>
          
          <button 
            onClick={() => setView(View.CALCULATOR)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors shadow-lg shadow-orange-500/20"
          >
            Abrir Calculadora
          </button>
        </div>
      </div>
    </div>
  );
};