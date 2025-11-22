
import React, { useState, useMemo } from 'react';
import { MOCK_LEADS, MOCK_SALES, MOCK_BROKER_PERFORMANCE, MOCK_USERS } from '../constants';
import { Lead, Sale, LeadDocument } from '../types';
import { 
  BarChart3, Users, FileText, DollarSign, Download, Filter, 
  Search, CheckCircle2, XCircle, Clock, ChevronDown, ArrowUpRight, 
  AlertCircle, TrendingUp, Calendar, FileCheck, MoreHorizontal, ShieldCheck,
  Eye, X, User as UserIcon, MessageCircle, Timer, FolderOpen
} from 'lucide-react';

export const Management: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'brokers' | 'documents' | 'sales'>('dashboard');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Modal
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Simulated State (In a real app, this would come from the API/Context)
  const [leads] = useState<Lead[]>(MOCK_LEADS);
  
  // Flattened docs state for the main table
  const [docs, setDocs] = useState(() => 
    leads.flatMap(lead => (lead.documents || []).map(d => ({...d, leadName: lead.name, leadId: lead.id})))
  );

  // --- METRICS CALCULATION ---
  const kpis = useMemo(() => {
    const totalSales = MOCK_SALES.length;
    const totalRevenue = MOCK_SALES.reduce((acc, s) => acc + s.value, 0);
    const totalLeads = leads.length;
    const activeBrokers = MOCK_USERS.filter(u => u.role === 'corretor').length;
    const pendingDocs = docs.filter(d => d.status === 'PENDENTE').length;
    const conversionRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0.0';
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const avgTime = 24; // Days (Mocked)

    return {
      totalSales,
      totalRevenue,
      totalLeads,
      activeBrokers,
      pendingDocs,
      conversionRate,
      avgTicket,
      avgTime
    };
  }, [leads, docs]);

  // --- HANDLERS ---
  const handleApproveDoc = (docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'APROVADO' } : d));
  };

  const handleRejectDoc = (docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'REJEITADO' } : d));
  };

  const handleDownloadDoc = (docName: string) => {
    alert(`Simulando download do arquivo: ${docName}`);
  };

  const handleViewDoc = (docName: string) => {
    alert(`Simulando visualização do arquivo: ${docName}`);
  };

  const handleExport = (type: string) => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Data,Tipo,Valor,Empreendimento\n" + 
      MOCK_SALES.map(s => `${s.id},${s.date},Venda,${s.value},${s.development || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_gestao_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get docs for the selected lead (Modal)
  const selectedLeadDocs = useMemo(() => {
    if (!selectedLeadId) return [];
    return docs.filter(d => d.leadId === selectedLeadId);
  }, [docs, selectedLeadId]);

  const selectedLeadName = useMemo(() => {
    if (!selectedLeadId) return '';
    return docs.find(d => d.leadId === selectedLeadId)?.leadName || 'Cliente';
  }, [docs, selectedLeadId]);


  // --- SUB-COMPONENTS ---

  const SummaryCard = ({ title, value, subtext, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute right-0 top-0 w-24 h-full opacity-5 -skew-x-12 translate-x-4 ${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : 'bg-orange-600'}`}></div>
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'green' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-auto z-10">
        {trend && <span className="text-green-600 flex items-center gap-0.5"><ArrowUpRight size={12} /> {trend}</span>}
        <span>{subtext}</span>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      'PENDENTE': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'APROVADO': 'bg-green-100 text-green-700 border-green-200',
      'REJEITADO': 'bg-red-100 text-red-700 border-red-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${(styles as any)[status] || styles['PENDENTE']}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-950 flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={32} /> Painel de Gestão
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Visão estratégica e controle operacional.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border border-slate-200 rounded-lg flex items-center p-1 shadow-sm">
            <Calendar size={14} className="ml-3 text-slate-400" />
            <select 
              className="bg-transparent border-none text-sm font-medium text-slate-600 focus:ring-0 p-2 cursor-pointer outline-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="today">Hoje</option>
              <option value="this_week">Esta Semana</option>
              <option value="this_month">Este Mês</option>
              <option value="this_year">Este Ano</option>
            </select>
          </div>

          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
             <button 
               onClick={() => setActiveTab('dashboard')}
               className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Visão Geral
             </button>
             <div className="w-px bg-slate-200"></div>
             <button 
               onClick={() => setActiveTab('brokers')}
               className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'brokers' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Corretores
             </button>
             <div className="w-px bg-slate-200"></div>
             <button 
               onClick={() => setActiveTab('documents')}
               className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'documents' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Documentos
               {kpis.pendingDocs > 0 && <span className="ml-2 bg-orange-500 text-white text-[10px] px-1.5 rounded-full">{kpis.pendingDocs}</span>}
             </button>
             <div className="w-px bg-slate-200"></div>
             <button 
               onClick={() => setActiveTab('sales')}
               className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'sales' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Vendas
             </button>
          </div>

          <button 
            onClick={() => handleExport(activeTab)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard 
              title="VGV Total" 
              value={kpis.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })} 
              subtext="Volume Geral de Vendas"
              icon={DollarSign}
              trend="+12.5%"
              color="green"
            />
            <SummaryCard 
              title="Total Leads" 
              value={kpis.totalLeads} 
              subtext={`Conv. ${kpis.conversionRate}%`}
              icon={Users}
              trend="+5.2%"
              color="blue"
            />
            <SummaryCard 
              title="Documentos" 
              value={kpis.pendingDocs} 
              subtext="Pendentes de Análise"
              icon={FileText}
              color="orange"
            />
            <SummaryCard 
              title="Tempo Médio Venda" 
              value={`${kpis.avgTime} Dias`}
              subtext="Lead até Assinatura"
              icon={Timer}
              color="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Documents Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                   <Clock size={16} className="text-orange-500" /> Aprovações Recentes
                 </h3>
                 <button onClick={() => setActiveTab('documents')} className="text-xs font-medium text-blue-600 hover:underline">Ver tudo</button>
               </div>
               <div className="p-4 space-y-3">
                 {docs.slice(0, 4).map((doc, i) => (
                   <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${doc.status === 'APROVADO' ? 'bg-green-100 text-green-600' : doc.status === 'REJEITADO' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                           {doc.status === 'APROVADO' ? <CheckCircle2 size={14} /> : doc.status === 'REJEITADO' ? <XCircle size={14} /> : <Clock size={14} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 line-clamp-1">{doc.type}</p>
                          <p className="text-[10px] text-slate-400">{doc.leadName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Sales Funnel Widget (Simple Visual) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:col-span-2">
              <div className="p-5 border-b border-slate-100">
                 <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                   <BarChart3 size={16} className="text-blue-600" /> Funil de Conversão
                 </h3>
              </div>
              <div className="p-6 flex flex-col justify-center gap-4 h-full">
                 <div className="w-full bg-blue-50 rounded-lg h-8 relative overflow-hidden flex items-center px-4">
                    <div className="absolute left-0 top-0 h-full bg-blue-200 w-full rounded-r-lg"></div>
                    <span className="relative z-10 text-xs font-bold text-blue-900 flex justify-between w-full">
                       <span>Total Leads</span>
                       <span>{kpis.totalLeads} (100%)</span>
                    </span>
                 </div>
                 <div className="w-[70%] bg-blue-50 rounded-lg h-8 relative overflow-hidden flex items-center px-4">
                    <div className="absolute left-0 top-0 h-full bg-blue-300 w-full rounded-r-lg"></div>
                    <span className="relative z-10 text-xs font-bold text-blue-900 flex justify-between w-full">
                       <span>Em Atendimento</span>
                       <span>{Math.floor(kpis.totalLeads * 0.7)} (70%)</span>
                    </span>
                 </div>
                 <div className="w-[40%] bg-blue-50 rounded-lg h-8 relative overflow-hidden flex items-center px-4">
                    <div className="absolute left-0 top-0 h-full bg-blue-400 w-full rounded-r-lg"></div>
                    <span className="relative z-10 text-xs font-bold text-blue-900 flex justify-between w-full">
                       <span>Propostas</span>
                       <span>{Math.floor(kpis.totalLeads * 0.4)} (40%)</span>
                    </span>
                 </div>
                 <div className="w-[15%] bg-blue-50 rounded-lg h-8 relative overflow-hidden flex items-center px-4">
                    <div className="absolute left-0 top-0 h-full bg-green-500 w-full rounded-r-lg"></div>
                    <span className="relative z-10 text-xs font-bold text-white flex justify-between w-full">
                       <span>Vendas</span>
                       <span>{kpis.totalSales} ({kpis.conversionRate}%)</span>
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BROKERS VIEW */}
      {activeTab === 'brokers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h3 className="font-bold text-slate-700 text-sm">Desempenho da Equipe</h3>
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar corretor..." 
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Corretor</th>
                <th className="px-6 py-4 font-medium text-center">Vendas</th>
                <th className="px-6 py-4 font-medium text-right">VGV Total</th>
                <th className="px-6 py-4 font-medium text-center">Leads / Msgs</th>
                <th className="px-6 py-4 font-medium text-center">Conversão</th>
                <th className="px-6 py-4 font-medium text-right">Último Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_BROKER_PERFORMANCE.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((broker) => (
                <tr key={broker.id} className="hover:bg-slate-50 transition-colors group">
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {broker.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-semibold text-slate-800">{broker.name}</p>
                           <p className="text-[10px] text-slate-400">ID: {broker.id}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold text-xs">{broker.sales}</span>
                   </td>
                   <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {broker.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                   </td>
                   <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-600">{broker.activeLeads} Leads</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MessageCircle size={10} /> {broker.messagesCount} msgs
                        </span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: broker.conversionRate }}></div>
                         </div>
                         <span className="text-xs font-medium">{broker.conversionRate}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right text-xs text-slate-500">
                      {broker.lastLogin || '-'}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DOCUMENTS VIEW (Approval Queue) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Fila de Aprovação de Documentos</h3>
             <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">Pendentes ({docs.filter(d => d.status === 'PENDENTE').length})</button>
                <button className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200">Histórico</button>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500">
                 <tr>
                   <th className="px-6 py-4 font-medium">Documento</th>
                   <th className="px-6 py-4 font-medium">Cliente / Lead</th>
                   <th className="px-6 py-4 font-medium">Data Envio</th>
                   <th className="px-6 py-4 font-medium text-center">Status</th>
                   <th className="px-6 py-4 font-medium text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {docs.sort((a,b) => (a.status === 'PENDENTE' ? -1 : 1)).map((doc, idx) => (
                   <tr key={`${doc.id}-${idx}`} className={`hover:bg-slate-50 transition-colors ${doc.status === 'PENDENTE' ? 'bg-white' : 'bg-slate-50/50 opacity-75'}`}>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                               <FileText size={18} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-700">{doc.name}</p>
                               <p className="text-xs text-slate-400">{doc.type} • {doc.size}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div 
                            onClick={() => setSelectedLeadId(doc.leadId)}
                            className="group cursor-pointer hover:bg-slate-100 p-2 rounded-lg -ml-2 transition-colors"
                            title="Clique para ver todos os documentos deste cliente"
                         >
                            <p className="font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                               {doc.leadName}
                            </p>
                            <p className="text-xs text-slate-400">ID: {doc.leadId}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                         {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                         <p className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                         {doc.status === 'PENDENTE' ? (
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => handleRejectDoc(doc.id)}
                                 className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                 title="Rejeitar"
                               >
                                  <XCircle size={18} />
                               </button>
                               <button 
                                 onClick={() => handleApproveDoc(doc.id)}
                                 className="p-2 text-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                 title="Aprovar"
                               >
                                  <CheckCircle2 size={18} />
                               </button>
                            </div>
                         ) : (
                            <span className="text-slate-400 italic text-xs">Processado</span>
                         )}
                      </td>
                   </tr>
                 ))}
                 {docs.length === 0 && (
                   <tr><td colSpan={5} className="text-center py-12 text-slate-400">Nenhum documento na fila.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* SALES VIEW */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Registro de Vendas</h3>
              <button className="text-blue-600 text-xs font-bold hover:underline">Ver Relatório Completo</button>
           </div>
           <table className="w-full text-left text-sm">
             <thead className="bg-white text-slate-500">
               <tr>
                 <th className="px-6 py-4 font-medium">Empreendimento / Cliente</th>
                 <th className="px-6 py-4 font-medium">Valor Venda</th>
                 <th className="px-6 py-4 font-medium">Valor Nota (Comissão)</th>
                 <th className="px-6 py-4 font-medium">Etapa</th>
                 <th className="px-6 py-4 font-medium text-right">Data</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {MOCK_SALES.map((sale) => (
                 <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                       <p className="font-bold text-slate-800">{sale.development || sale.propertyName}</p>
                       <p className="text-xs text-slate-500">{sale.clientName}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                       {sale.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600 bg-green-50/50">
                       {(sale.invoiceValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                          {sale.status.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                       {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {/* LEAD DOCS DETAILS MODAL */}
      {selectedLeadId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-4xl p-0 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                 <div>
                    <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                      <UserIcon size={24} className="text-blue-600" />
                      <span className="mr-2">{selectedLeadName}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">ID: {selectedLeadId}</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Central de Documentação do Cliente</p>
                 </div>
                 <button 
                    onClick={() => setSelectedLeadId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                 >
                    <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedLeadDocs.length > 0 ? selectedLeadDocs.map((doc, idx) => (
                       <div key={`${doc.id}-${idx}`} className="bg-white p-4 border border-slate-200 rounded-xl hover:shadow-lg transition-all flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <FileText size={24} />
                             </div>
                             <StatusBadge status={doc.status} />
                          </div>
                          
                          <div className="flex-1">
                             <h4 className="font-bold text-slate-800 line-clamp-2 mb-1">{doc.name}</h4>
                             <p className="text-xs text-slate-500">{doc.type}</p>
                             <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <Clock size={10} /> Enviado: {new Date(doc.uploadedAt).toLocaleDateString()}
                             </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                              <button 
                                 onClick={() => handleViewDoc(doc.name)}
                                 className="flex items-center justify-center gap-1 p-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                              >
                                 <Eye size={14} /> Visualizar
                              </button>
                              <button 
                                 onClick={() => handleDownloadDoc(doc.name)}
                                 className="flex items-center justify-center gap-1 p-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                              >
                                 <Download size={14} /> Baixar
                              </button>
                          </div>

                          {doc.status === 'PENDENTE' && (
                             <div className="mt-2 grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => handleRejectDoc(doc.id)}
                                  className="flex items-center justify-center gap-1 p-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                   <XCircle size={14} /> Rejeitar
                                </button>
                                <button 
                                  onClick={() => handleApproveDoc(doc.id)}
                                  className="flex items-center justify-center gap-1 p-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                >
                                   <CheckCircle2 size={14} /> Aprovar
                                </button>
                             </div>
                          )}
                       </div>
                    )) : (
                       <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <FolderOpen size={48} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">Nenhum documento encontrado para este cliente.</p>
                       </div>
                    )}
                 </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                 <button 
                    onClick={() => setSelectedLeadId(null)}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors"
                 >
                    Fechar Visualização
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
