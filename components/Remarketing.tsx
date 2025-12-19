import React, { useState, useRef, useEffect } from 'react';
import { Lead, LeadStatus, Campaign, SaleDetails, NegotiationStage, LeadDocument, User, DocumentType } from '../types';
import { 
  Send, Upload, Clock, Search, Download, Plus, Trash2, CheckSquare, Square, MessageCircle,
  CalendarCheck, Users, DollarSign, Building2, FileCheck, Paperclip, FileText, X, Eye, User as UserIcon, ShieldCheck, Loader2, Wand2
} from 'lucide-react';
import { generateCampaignVariations, CampaignVariation } from '../services/geminiService';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface RemarketingProps {
  user: User;
}

export const Remarketing: React.FC<RemarketingProps> = ({ user }) => {
  // --- State: View Mode ---
  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns' | 'documents'>('leads');

  // --- State: Data & Selection ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  
  // Mock Campaigns for now (Integration TODO later)
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: 'c-mock-1', title: 'Reativação Outubro', message: 'Olá, temos novidades...', audienceCount: 15, scheduledFor: '2023-10-30 14:00', status: 'scheduled', type: 'UNICO' }
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');

  // --- State: Campaign & AI ---
  const [campaignObjective, setCampaignObjective] = useState('');
  const [message, setMessage] = useState('');
  const [aiVariations, setAiVariations] = useState<CampaignVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState({ date: '', time: '', type: 'UNICO' });

  // --- State: Modals ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLead, setNewLead] = useState<{
    name: string;
    phone: string;
    income: string;
    status: LeadStatus;
    visitDate?: string;
    documents: LeadDocument[];
  }>({ name: '', phone: '', income: '', status: 'novo', documents: [] });
  
  // New Sale Details State
  const [saleDetails, setSaleDetails] = useState<SaleDetails>({
    propertyValue: 0,
    invoiceValue: 0,
    developmentName: '',
    stage: 'contrato_construtora_assinado',
    saleDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Document Upload State
  const [docType, setDocType] = useState<DocumentType>('rg_cnh');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // --- FIRESTORE SUBSCRIPTION ---
  useEffect(() => {
    setIsLoadingLeads(true);
    const leadsCollection = collection(db, 'leads');
    
    let q;
    
    // Se for gestor/admin, vê tudo. Se for corretor, vê apenas os seus (ou atribuídos)
    if (user.role === 'corretor') {
       // Em um cenário real, filtraríamos por assignedTo == user.id
       // Como estamos migrando, vamos mostrar todos ou filtrar se o campo existir
       q = query(leadsCollection, orderBy('createdAt', 'desc')); 
       // TODO: Adicionar filtro: where('assignedTo', '==', user.id)
    } else {
       q = query(leadsCollection, orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          // Convert Firestore Timestamp to ISO string if needed, handling standard mock date strings too
          created_at: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.created_at || new Date().toISOString())
        } as Lead;
      });
      setLeads(fetchedLeads);
      setIsLoadingLeads(false);
    }, (error) => {
      console.error("Erro ao buscar leads:", error);
      setIsLoadingLeads(false);
    });

    return () => unsubscribe();
  }, [user.role, user.id]);


  // --- Derived Data ---
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Flatten documents for the "Documents" tab (Admin View)
  const allDocuments = leads.flatMap(lead => 
    (lead.documents || []).map(d => ({ ...d, leadName: lead.name, leadId: lead.id }))
  ).filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.leadName?.toLowerCase().includes(search.toLowerCase())
  );

  // --- Handlers: Selection ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- Handlers: CRUD & Actions ---
  const handleDelete = async () => {
    if (window.confirm(`Excluir ${selectedIds.size} leads selecionados? Esta ação é permanente.`)) {
      try {
        const idsToDelete = Array.from(selectedIds);
        const deletePromises = idsToDelete.map(id => {
          const leadRef = doc(db, 'leads', id);
          return deleteDoc(leadRef);
        });
        
        await Promise.all(deletePromises);
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Erro ao excluir leads:", error);
        alert("Erro ao excluir leads. Verifique suas permissões.");
      }
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.phone) return alert("Nome e Telefone obrigatórios");
    
    // Validation for Sale Details
    if (newLead.status === 'vendido') {
      if (!saleDetails.propertyValue || !saleDetails.invoiceValue || !saleDetails.developmentName) {
        return alert("Para registrar uma venda, preencha o Valor do Imóvel, Valor da Nota e Empreendimento.");
      }
    }

    setIsSaving(true);

    try {
      const leadData = {
        name: newLead.name,
        phone: newLead.phone,
        income: parseFloat(newLead.income) || 0,
        status: newLead.status,
        visitDate: newLead.visitDate || null,
        createdAt: Timestamp.now(), // Firestore Timestamp
        assignedTo: user.id, // Assign to creator by default
        createdBy: user.name,
        // Include sale details only if status is sold
        saleDetails: newLead.status === 'vendido' ? saleDetails : null,
        documents: newLead.documents.map(d => ({...d, uploadedAt: new Date().toISOString()})) // Ensure plain objects
      };

      await addDoc(collection(db, 'leads'), leadData);
      
      setShowCreateModal(false);
      
      // Reset Forms
      setNewLead({ name: '', phone: '', income: '', status: 'novo', documents: [] });
      setSaleDetails({
        propertyValue: 0,
        invoiceValue: 0,
        developmentName: '',
        stage: 'contrato_construtora_assinado',
        saleDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      console.error("Erro ao criar lead:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation (Simulation)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("O arquivo deve ter no máximo 5MB.");
      return;
    }

    const newDoc: LeadDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: docType,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      url: '#', // In a real app, this would be the uploaded URL from Firebase Storage
      uploadedAt: new Date().toISOString(),
      uploaderName: user.name,
      isActive: true,
      status: 'ENVIADO'
    };

    setNewLead(prev => ({
      ...prev,
      documents: [...prev.documents, newDoc]
    }));
    
    // Reset input
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleDeleteDocument = (docId: string) => {
    setNewLead(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== docId)
    }));
  };

  const handleViewDocument = (documentItem: LeadDocument) => {
     alert(`Visualizando documento: ${documentItem.name}\nURL (Simulada): ${documentItem.url}`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTimeout(() => {
        alert(`Função de importação em massa será conectada à Cloud Function 'createLead' na próxima etapa.`);
      }, 1000);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID,Nome,Telefone,Renda,Status,Criado em'];
    const data = (selectedIds.size > 0 ? leads.filter(l => selectedIds.has(l.id)) : filteredLeads)
      .map(l => `${l.id},${l.name},${l.phone},${l.income || 0},${l.status},${l.created_at}`);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...data].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "imobmaster_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Handlers: AI & Campaign ---
  const handleGenerateAI = async () => {
    if (!campaignObjective) return alert("Defina um objetivo para a campanha");
    setIsGenerating(true);
    
    const sampleLead = leads.find(l => selectedIds.has(l.id)) || leads[0];
    const count = selectedIds.size || filteredLeads.length;
    
    const variations = await generateCampaignVariations(campaignObjective, count, sampleLead?.name || "Cliente");
    setAiVariations(variations);
    setIsGenerating(false);
  };

  const handleSchedule = () => {
    // Mock implementation for frontend, would connect to Cloud Function later
    const recipients = selectedIds.size > 0 
      ? leads.filter(l => selectedIds.has(l.id))
      : filteredLeads;

    if (recipients.length === 0) {
      alert("Não há leads visíveis para enviar a campanha.");
      return;
    }

    if (!message) {
      alert("Por favor, escreva ou gere uma mensagem antes de agendar.");
      return;
    }

    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
      title: campaignObjective || 'Campanha Rápida',
      message: message,
      audienceCount: recipients.length,
      scheduledFor: (schedule.date && schedule.time) ? `${schedule.date} às ${schedule.time}` : 'Envio Imediato',
      status: 'scheduled',
      type: schedule.type
    };

    setCampaigns([newCampaign, ...campaigns]);
    setActiveTab('campaigns');
    setMessage('');
    setCampaignObjective('');
    setAiVariations([]);
    setSelectedIds(new Set());
    setSchedule({ date: '', time: '', type: 'UNICO' });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://web.whatsapp.com/send?phone=${fullPhone}&text=${encodedMsg}`, '_blank');
  };

  const getStatusBadge = (status: LeadStatus) => {
    const styles: Record<LeadStatus, string> = {
      'novo': 'bg-blue-100 text-blue-700',
      'pendente': 'bg-yellow-100 text-yellow-700',
      'em_contato': 'bg-purple-100 text-purple-700',
      'documentacao': 'bg-orange-100 text-orange-700',
      'aprovado': 'bg-green-100 text-green-700',
      'negado': 'bg-red-100 text-red-700',
      'vendido': 'bg-green-200 text-green-800'
    };
    const labels: Record<LeadStatus, string> = {
      'novo': 'Novo',
      'pendente': 'Pendente',
      'em_contato': 'Em Contato',
      'documentacao': 'Documentação',
      'aprovado': 'Aprovado',
      'negado': 'Negado',
      'vendido': 'Vendido'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const statusOptions: LeadStatus[] = ['novo', 'pendente', 'em_contato', 'documentacao', 'aprovado', 'negado', 'vendido'];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      
      {/* LEFT PANEL: Lead Management & Campaigns List */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Panel Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('leads')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'leads' ? 'text-blue-900 border-b-2 border-orange-500 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Users size={18} /> Gerenciar Leads
          </button>
          <button 
             onClick={() => setActiveTab('campaigns')}
             className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'campaigns' ? 'text-blue-900 border-b-2 border-orange-500 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <CalendarCheck size={18} /> Campanhas
            {campaigns.length > 0 && <span className="bg-orange-100 text-orange-600 px-2 rounded-full text-[10px]">{campaigns.length}</span>}
          </button>
          
          {/* ADMIN ONLY TAB */}
          {(user.role === 'gestor' || user.role === 'admin') && (
            <button 
               onClick={() => setActiveTab('documents')}
               className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'documents' ? 'text-blue-900 border-b-2 border-orange-500 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ShieldCheck size={18} /> Repositório
            </button>
          )}
        </div>

        {/* VIEW: LEADS LIST */}
        {activeTab === 'leads' && (
          <>
            <div className="p-4 border-b border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleImportCSV}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Upload size={16} /> <span className="hidden sm:inline">Importar</span>
                  </button>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={16} /> <span className="hidden sm:inline">Novo</span>
                  </button>
                </div>
                
                <div className="flex gap-3 flex-1 justify-end">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar..." 
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button onClick={handleExportCSV} className="px-3 py-2 text-slate-500 border border-slate-200 rounded-lg">
                    <Download size={18} />
                  </button>
                  {selectedIds.size > 0 && (
                    <button onClick={handleDelete} className="px-3 py-2 text-red-500 border border-red-100 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                   onClick={() => setStatusFilter('ALL')}
                   className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                   Todos
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === status ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingLeads ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                          {selectedIds.size > 0 && selectedIds.size === filteredLeads.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </th>
                      <th className="p-4">Lead</th>
                      <th className="p-4 hidden md:table-cell">Renda</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(lead.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="p-4">
                          <button onClick={() => toggleSelect(lead.id)} className={`${selectedIds.has(lead.id) ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}>
                            {selectedIds.has(lead.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{lead.name}</div>
                          <div className="text-xs text-slate-400">{lead.phone}</div>
                          {lead.saleDetails && (
                             <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                <DollarSign size={10} /> Venda: R$ {lead.saleDetails.propertyValue.toLocaleString('pt-BR')}
                             </div>
                          )}
                          {lead.documents && lead.documents.length > 0 && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 ml-1">
                               <Paperclip size={10} /> {lead.documents.length} arq.
                            </div>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell text-sm text-slate-600">
                          {lead.income ? `R$ ${lead.income.toLocaleString('pt-BR')}` : '-'}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(lead.status)}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => openWhatsApp(lead.phone)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Abrir WhatsApp Web">
                            <MessageCircle size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                           Nenhum lead encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between">
              <span>{filteredLeads.length} leads visíveis</span>
              <span>{selectedIds.size} selecionados</span>
            </div>
          </>
        )}

        {/* VIEW: CAMPAIGNS LIST */}
        {activeTab === 'campaigns' && (
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {campaigns.map(campaign => (
                 <div key={campaign.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <h3 className="font-bold text-blue-950">{campaign.title}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                             <Clock size={12} /> Agendado para: <span className="font-semibold">{campaign.scheduledFor}</span>
                          </p>
                       </div>
                       <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                          {campaign.status === 'scheduled' ? 'Agendado' : campaign.status}
                       </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic mb-3 border border-slate-100">
                       "{campaign.message}"
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                       <span className="flex items-center gap-1 font-medium">
                          <Users size={14} /> Público: {campaign.audienceCount} destinatários
                       </span>
                       <span className="flex items-center gap-1">
                          Frequência: <span className="font-bold">{campaign.type}</span>
                       </span>
                    </div>
                 </div>
              ))}
              {campaigns.length === 0 && (
                 <div className="text-center py-12 text-slate-400">
                    <CalendarCheck size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Nenhuma campanha agendada.</p>
                 </div>
              )}
           </div>
        )}

        {/* VIEW: DOCUMENTS LIST (Admin) */}
        {activeTab === 'documents' && (
           <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                   <tr>
                      <th className="p-4 font-medium">Documento</th>
                      <th className="p-4 font-medium">Cliente</th>
                      <th className="p-4 font-medium">Data</th>
                      <th className="p-4 font-medium text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {allDocuments.map((documentItem, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                         <td className="p-4">
                            <div className="font-bold text-slate-700">{documentItem.name}</div>
                            <div className="text-xs text-slate-400">{documentItem.type} • {documentItem.size}</div>
                         </td>
                         <td className="p-4 text-slate-600">{documentItem.leadName}</td>
                         <td className="p-4 text-slate-500 text-xs">
                            {new Date(documentItem.uploadedAt).toLocaleDateString()}
                         </td>
                         <td className="p-4 text-right">
                            <button 
                               onClick={() => handleViewDocument(documentItem)}
                               className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                            >
                               <Eye size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                   {allDocuments.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum documento encontrado.</td></tr>
                   )}
                </tbody>
              </table>
           </div>
        )}
      </div>

      {/* RIGHT PANEL: Campaign Creator / Details */}
      <div className="w-96 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col overflow-y-auto">
        <h3 className="font-bold text-blue-950 text-lg mb-6 flex items-center gap-2">
          <Wand2 className="text-orange-500" size={20} /> Criar Campanha
        </h3>

        <div className="space-y-6">
          {/* Audience Summary */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Público Alvo</p>
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              <span className="text-xl font-bold text-blue-900">
                {selectedIds.size > 0 ? selectedIds.size : filteredLeads.length}
              </span>
              <span className="text-sm text-blue-700">leads selecionados</span>
            </div>
          </div>

          {/* Goal Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Objetivo da Campanha</label>
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none h-24"
              placeholder="Ex: Oferecer desconto de 5% no empreendimento X para leads interessados..."
              value={campaignObjective}
              onChange={e => setCampaignObjective(e.target.value)}
            />
          </div>

          {/* AI Generator Button */}
          <button 
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            {isGenerating ? 'Criando Mensagens...' : 'Gerar com IA'}
          </button>

          {/* Variations List */}
          {aiVariations.length > 0 && (
             <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sugestões da IA:</p>
                {aiVariations.map((variation, idx) => (
                   <div 
                      key={idx} 
                      onClick={() => setMessage(variation.message)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${message === variation.message ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-200 hover:border-orange-300 bg-white'}`}
                   >
                      <div className="flex justify-between mb-1">
                         <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{variation.style}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">"{variation.message}"</p>
                   </div>
                ))}
             </div>
          )}

          {/* Manual Message Editor */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem Final</label>
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none h-32"
              placeholder="A mensagem final aparecerá aqui..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                <input 
                   type="date" 
                   className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                   value={schedule.date}
                   onChange={e => setSchedule({...schedule, date: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                <input 
                   type="time" 
                   className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                   value={schedule.time}
                   onChange={e => setSchedule({...schedule, time: e.target.value})}
                />
             </div>
          </div>

          <button 
             onClick={handleSchedule}
             className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
          >
             <Send size={18} /> Agendar Envio
          </button>

        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-blue-950">Novo Lead / Cliente</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
               {/* Basic Info */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo</label>
                     <input 
                        className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        placeholder="Ex: João Silva"
                        value={newLead.name}
                        onChange={e => setNewLead({...newLead, name: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Telefone (WhatsApp)</label>
                     <input 
                        className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        placeholder="11999999999"
                        value={newLead.phone}
                        onChange={e => setNewLead({...newLead, phone: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Renda Mensal</label>
                     <input 
                        type="number"
                        className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        placeholder="R$ 0,00"
                        value={newLead.income}
                        onChange={e => setNewLead({...newLead, income: e.target.value})}
                     />
                  </div>
               </div>

               {/* Status & Docs */}
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Status Atual</label>
                  <select 
                     className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                     value={newLead.status}
                     onChange={e => setNewLead({...newLead, status: e.target.value as LeadStatus})}
                  >
                     {statusOptions.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                     ))}
                  </select>
               </div>

               {/* Sale Details Section (Only if Status is Sold) */}
               {newLead.status === 'vendido' && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-3 animate-in slide-in-from-top-2">
                     <h4 className="font-bold text-green-800 text-sm flex items-center gap-2">
                        <DollarSign size={16} /> Detalhes da Venda
                     </h4>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="block text-xs font-bold text-green-700 mb-1">Empreendimento</label>
                           <input 
                              className="w-full p-2 rounded border border-green-200 text-sm"
                              value={saleDetails.developmentName}
                              onChange={e => setSaleDetails({...saleDetails, developmentName: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-green-700 mb-1">Etapa</label>
                           <select
                              className="w-full p-2 rounded border border-green-200 text-sm"
                              value={saleDetails.stage}
                              onChange={e => setSaleDetails({...saleDetails, stage: e.target.value as NegotiationStage})}
                           >
                              <option value="contrato_construtora_assinado">Contrato Construtora</option>
                              <option value="aguardando_assinatura_caixa">Aguardando Banco</option>
                              <option value="contrato_caixa_assinado">Contrato Banco</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-green-700 mb-1">Valor Venda</label>
                           <input 
                              type="number"
                              className="w-full p-2 rounded border border-green-200 text-sm"
                              value={saleDetails.propertyValue}
                              onChange={e => setSaleDetails({...saleDetails, propertyValue: Number(e.target.value)})}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-green-700 mb-1">Valor Nota (Comissão)</label>
                           <input 
                              type="number"
                              className="w-full p-2 rounded border border-green-200 text-sm"
                              value={saleDetails.invoiceValue}
                              onChange={e => setSaleDetails({...saleDetails, invoiceValue: Number(e.target.value)})}
                           />
                        </div>
                     </div>
                  </div>
               )}

               {/* Document Upload Section */}
               <div className="border-t border-slate-100 pt-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Anexar Documentos</label>
                  <div className="flex gap-2 mb-3">
                     <select 
                        className="flex-1 p-2 rounded-lg border border-slate-200 text-sm"
                        value={docType}
                        onChange={e => setDocType(e.target.value as DocumentType)}
                     >
                        <option value="rg_cnh">RG / CNH</option>
                        <option value="comprovante_renda">Comprovante Renda</option>
                        <option value="comprovante_residencia">Comprovante Residência</option>
                        <option value="extratos_bancarios">Extratos Bancários</option>
                        <option value="declaracao_ir">Declaração IR</option>
                        <option value="outros">Outros</option>
                     </select>
                     <input 
                        type="file" 
                        ref={docInputRef}
                        className="hidden" 
                        onChange={handleAddDocument}
                     />
                     <button 
                        onClick={() => docInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-2"
                     >
                        <Upload size={16} /> Upload
                     </button>
                  </div>
                  
                  {/* Docs List */}
                  <div className="space-y-2">
                     {newLead.documents.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                           <div className="flex items-center gap-2 overflow-hidden">
                              <FileCheck size={16} className="text-blue-500 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{d.name}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-200 px-1 rounded">{d.type}</span>
                           </div>
                           <button onClick={() => handleDeleteDocument(d.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
               <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
               >
                  Cancelar
               </button>
               <button 
                  onClick={handleCreateLead}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 flex items-center gap-2 disabled:opacity-50"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckSquare size={18} />}
                  Salvar Lead
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};