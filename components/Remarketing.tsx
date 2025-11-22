
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
      const fetchedLeads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
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
    (lead.documents || []).map(doc => ({ ...doc, leadName: lead.name, leadId: lead.id }))
  ).filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.leadName?.toLowerCase().includes(search.toLowerCase())
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
    if (confirm(`Excluir ${selectedIds.size} leads selecionados? Esta ação é permanente.`)) {
      try {
        const idsToDelete = Array.from(selectedIds);
        await Promise.all(idsToDelete.map(id => deleteDoc(doc(db, 'leads', id))));
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

  const handleViewDocument = (doc: LeadDocument) => {
     alert(`Visualizando documento: ${doc.name}\nURL (Simulada): ${doc.url}`);
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

        {/* VIEW: