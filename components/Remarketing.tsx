import React, { useState, useRef, useEffect } from 'react';
import { Lead, LeadStatus, Campaign, SaleDetails, NegotiationStage, LeadDocument, User, DocumentType } from '../types';
import { 
  Send, Upload, Clock, Search, Download, Plus, Trash2, CheckSquare, Square, MessageCircle,
  CalendarCheck, Users, DollarSign, Building2, FileCheck, Paperclip, FileText, X, Eye, User as UserIcon, ShieldCheck, Loader2, Wand2, HandCoins
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
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
  
  const [saleDetails, setSaleDetails] = useState<SaleDetails>({
    propertyValue: 0,
    invoiceValue: 0,
    developmentName: '',
    stage: 'contrato_construtora_assinado',
    saleDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // FIRESTORE SUBSCRIPTION
  useEffect(() => {
    setIsLoadingLeads(true);
    const leadsCollection = collection(db, 'leads');
    const q = query(leadsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
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
  }, []);


  // Derived Data
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allDocuments = leads.flatMap(lead => 
    (lead.documents || []).map(d => ({ ...d, leadName: lead.name, leadId: lead.id }))
  ).filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.leadName?.toLowerCase().includes(search.toLowerCase())
  );

  // Handlers
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

  const handleDelete = async () => {
    if (window.confirm(`Excluir ${selectedIds.size} leads selecionados?`)) {
      const idsToDelete = Array.from(selectedIds);
      const deletePromises = idsToDelete.map(id => deleteDoc(doc(db, 'leads', id)));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.phone) return alert("Nome e Telefone obrigatórios");
    setIsSaving(true);
    try {
      const leadData = {
        name: newLead.name,
        phone: newLead.phone,
        income: parseFloat(newLead.income) || 0,
        status: newLead.status,
        createdAt: Timestamp.now(),
        assignedTo: user.id,
        createdBy: user.name,
        saleDetails: newLead.status === 'vendido' ? saleDetails : null,
        documents: newLead.documents
      };
      await addDoc(collection(db, 'leads'), leadData);
      setShowCreateModal(false);
      setNewLead({ name: '', phone: '', income: '', status: 'novo', documents: [] });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSell = (lead: Lead) => {
    setNewLead({
      name: lead.name,
      phone: lead.phone,
      income: lead.income?.toString() || '',
      status: 'vendido',
      documents: lead.documents || []
    });
    setSaleDetails({
      propertyValue: lead.saleDetails?.propertyValue || 0,
      invoiceValue: lead.saleDetails?.invoiceValue || 0,
      developmentName: lead.saleDetails?.developmentName || '',
      stage: 'contrato_construtora_assinado',
      saleDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowCreateModal(true);
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://web.whatsapp.com/send?phone=${fullPhone}`, '_blank');
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
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const statusOptions: LeadStatus[] = ['novo', 'pendente', 'em_contato', 'documentacao', 'aprovado', 'negado', 'vendido'];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab('leads')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'leads' ? 'text-blue-900 border-b-2 border-orange-500 bg-blue-50/50' : 'text-slate-400'}`}><Users size={18} /> Leads</button>
          <button onClick={() => setActiveTab('campaigns')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'campaigns' ? 'text-blue-900 border-b-2 border-orange-500 bg-blue-50/50' : 'text-slate-400'}`}><CalendarCheck size={18} /> Campanhas</button>
        </div>

        {activeTab === 'leads' && (
          <>
            <div className="p-4 border-b border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"><Plus size={16} /> Novo Lead</button>
                <div className="flex gap-2 flex-1 justify-end">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-500" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {selectedIds.size > 0 && <button onClick={handleDelete} className="px-3 py-2 text-red-500 border border-red-100 rounded-lg"><Trash2 size={18} /></button>}
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button onClick={() => setStatusFilter('ALL')} className={`px-3 py-1 rounded-full text-xs font-bold ${statusFilter === 'ALL' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Todos</button>
                {statusOptions.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusFilter === s ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{s.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingLeads ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-500" /></div> : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500">
                    <tr className="text-left font-bold uppercase tracking-wider">
                      <th className="p-4 w-10"><button onClick={toggleSelectAll}>{selectedIds.size > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</button></th>
                      <th className="p-4">Lead</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50 border-b border-slate-50">
                        <td className="p-4"><button onClick={() => toggleSelect(lead.id)}>{selectedIds.has(lead.id) ? <CheckSquare className="text-blue-600" size={18} /> : <Square size={18} className="text-slate-300" />}</button></td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{lead.name}</div>
                          <div className="text-xs text-slate-400">{lead.phone}</div>
                        </td>
                        <td className="p-4">{getStatusBadge(lead.status)}</td>
                        <td className="p-4 text-right flex justify-end gap-1">
                          <button onClick={() => openWhatsApp(lead.phone)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><MessageCircle size={18} /></button>
                          {lead.status !== 'vendido' && (
                            <button onClick={() => handleQuickSell(lead)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Registrar Venda"><HandCoins size={18} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <div className="w-96 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-blue-950 text-lg mb-6 flex items-center gap-2"><Wand2 className="text-orange-500" size={20} /> Campanha IA</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-500 uppercase">Público selecionado</p>
            <p className="text-2xl font-bold text-blue-900">{selectedIds.size || filteredLeads.length} leads</p>
          </div>
          <textarea className="w-full p-3 border border-slate-200 rounded-xl text-sm h-32 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Objetivo da campanha..." value={campaignObjective} onChange={e => setCampaignObjective(e.target.value)} />
          <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"><Wand2 size={20} /> Gerar com IA</button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-blue-950">{newLead.status === 'vendido' ? 'Registrar Venda' : 'Novo Lead'}</h3>
              <button onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nome do Cliente" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
              <input className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" placeholder="WhatsApp" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
              <select className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" value={newLead.status} onChange={e => setNewLead({...newLead, status: e.target.value as LeadStatus})}>
                {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>

              {newLead.status === 'vendido' && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-3">
                  <h4 className="font-bold text-green-800 text-sm">Dados do Contrato</h4>
                  <input className="w-full p-2 rounded border border-green-200 text-sm" placeholder="Empreendimento" value={saleDetails.developmentName} onChange={e => setSaleDetails({...saleDetails, developmentName: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" className="p-2 rounded border border-green-200 text-sm" placeholder="VGV (Valor Venda)" value={saleDetails.propertyValue || ''} onChange={e => setSaleDetails({...saleDetails, propertyValue: Number(e.target.value)})} />
                    <input type="number" className="p-2 rounded border border-green-200 text-sm" placeholder="Comissão" value={saleDetails.invoiceValue || ''} onChange={e => setSaleDetails({...saleDetails, invoiceValue: Number(e.target.value)})} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
              <button onClick={handleCreateLead} className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg">{isSaving ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};