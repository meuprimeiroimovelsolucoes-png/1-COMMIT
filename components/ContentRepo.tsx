
import React, { useState } from 'react';
import { MOCK_CONTENT } from '../constants';
import { PropertyContent, User } from '../types';
import { Folder, Image as ImageIcon, Video, BookOpen, Download, Share2, Search, Plus, UploadCloud, X, CheckCircle2, Link, ShieldCheck, AlertCircle, Check, Trash2, Clock } from 'lucide-react';

interface ContentRepoProps {
  user: User;
}

export const ContentRepo: React.FC<ContentRepoProps> = ({ user }) => {
  const [contentList, setContentList] = useState<PropertyContent[]>(MOCK_CONTENT);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'book'>('all');
  const [search, setSearch] = useState('');
  
  // Admin View State
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  
  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    projectName: '',
    type: 'photo' as 'photo' | 'video' | 'book',
    fileSelected: false,
    externalLink: ''
  });

  const isAdmin = user.role === 'gestor' || user.role === 'admin';

  // Filter Logic
  const filteredContent = contentList.filter(item => {
    // 1. If in "Review Mode" (Admin only), show only PENDING
    if (showPendingOnly) {
      return item.status === 'PENDENTE';
    }

    // 2. General Gallery View
    // Show "APROVADO" items
    // OR show "PENDENTE" items ONLY if the current user uploaded them (so they can see their own status)
    const isApproved = item.status === 'APROVADO';
    const isMyPending = item.status === 'PENDENTE' && item.createdBy === user.name;
    
    if (!isApproved && !isMyPending) return false;

    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.projectName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = contentList.filter(c => c.status === 'PENDENTE').length;

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'photo': return <ImageIcon size={16} />;
      case 'video': return <Video size={16} />;
      case 'book': return <BookOpen size={16} />;
      default: return <Folder size={16} />;
    }
  };

  const handleUpload = () => {
    if (!uploadForm.projectName || (!uploadForm.fileSelected && !uploadForm.externalLink)) {
      alert("Por favor, preencha o nome do projeto e selecione um arquivo ou insira um link.");
      return;
    }

    // LOGIC: Admins approve immediately, Brokers go to Pending
    const initialStatus = isAdmin ? 'APROVADO' : 'PENDENTE';

    const newItem: PropertyContent = {
      id: Math.random().toString(36).substring(2, 9),
      projectName: uploadForm.projectName,
      type: uploadForm.type,
      url: uploadForm.externalLink || '#',
      thumbnail: `https://picsum.photos/300/200?random=${Math.random()}`,
      status: initialStatus,
      createdBy: user.name
    };

    setContentList([newItem, ...contentList]);
    setUploadForm({ projectName: '', type: 'photo', fileSelected: false, externalLink: '' });
    setIsUploadModalOpen(false);
    
    if (!isAdmin) {
      alert("Conteúdo enviado para análise da gestão! Você será notificado quando for aprovado.");
    }
  };

  const handleApprove = (id: string) => {
    setContentList(prev => prev.map(c => c.id === id ? { ...c, status: 'APROVADO' } : c));
  };

  const handleReject = (id: string) => {
    if (confirm("Tem certeza que deseja rejeitar e remover este conteúdo?")) {
      setContentList(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h2 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
             Central de Conteúdo
             {isAdmin && pendingCount > 0 && (
                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                   <ShieldCheck size={12} /> {pendingCount} pendentes
                </span>
             )}
           </h2>
           <p className="text-slate-500 text-sm">Materiais de marketing e vendas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
           {/* Admin Toggle for Review Mode */}
           {isAdmin && (
             <button 
               onClick={() => setShowPendingOnly(!showPendingOnly)}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border flex items-center gap-2 ${showPendingOnly ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
             >
               <ShieldCheck size={16} />
               {showPendingOnly ? 'Voltar para Galeria' : 'Revisar Pendentes'}
             </button>
           )}

           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
                type="text" 
                placeholder="Buscar projeto..." 
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full md:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <button 
             onClick={() => setIsUploadModalOpen(true)}
             className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
           >
             <Plus size={18} /> Enviar Novo
           </button>
        </div>
      </div>

      {/* Filters (Only show in Gallery mode) */}
      {!showPendingOnly && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'all' ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('book')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filter === 'book' ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <BookOpen size={14} /> Books Digitais
          </button>
          <button 
            onClick={() => setFilter('photo')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filter === 'photo' ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <ImageIcon size={14} /> Fotos
          </button>
          <button 
            onClick={() => setFilter('video')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filter === 'video' ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <Video size={14} /> Vídeos
          </button>
        </div>
      )}

      {/* Grid */}
      {showPendingOnly ? (
        // PENDING LIST VIEW (ADMIN)
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
           <div className="p-4 bg-orange-50 border-b border-orange-100 text-orange-800 font-bold text-sm flex items-center gap-2">
              <AlertCircle size={18} /> Itens Aguardando Aprovação
           </div>
           {filteredContent.length > 0 ? (
             <div className="divide-y divide-slate-100">
                {filteredContent.map(item => (
                   <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden relative">
                            <img src={item.thumbnail} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white">
                               {getTypeIcon(item.type)}
                            </div>
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800">{item.projectName}</h4>
                            <p className="text-xs text-slate-500">Enviado por: <span className="font-semibold">{item.createdBy}</span></p>
                            <a href={item.url} className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                               <Link size={10} /> Ver Link/Arquivo
                            </a>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleReject(item.id)}
                           className="px-3 py-2 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-2 transition-colors"
                         >
                           <Trash2 size={14} /> Rejeitar
                         </button>
                         <button 
                           onClick={() => handleApprove(item.id)}
                           className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                         >
                           <Check size={14} /> Aprovar
                         </button>
                      </div>
                   </div>
                ))}
             </div>
           ) : (
             <div className="p-12 text-center text-slate-400">
                <ShieldCheck size={48} className="mx-auto mb-2 opacity-20" />
                <p>Nenhum item pendente.</p>
             </div>
           )}
        </div>
      ) : (
        // GALLERY GRID VIEW
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl overflow-hidden border transition-all group shadow-sm hover:shadow-md ${item.status === 'PENDENTE' ? 'border-yellow-300 relative' : 'border-slate-200'}`}>
              {item.status === 'PENDENTE' && (
                 <div className="absolute top-2 left-2 z-20 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-yellow-200 flex items-center gap-1">
                    <Clock size={10} /> Em Análise
                 </div>
              )}
              <div className="relative h-40 bg-slate-100">
                <img src={item.thumbnail} alt={item.projectName} className={`w-full h-full object-cover ${item.status === 'PENDENTE' ? 'grayscale opacity-80' : ''}`} />
                <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md backdrop-blur-sm">
                  {getTypeIcon(item.type)}
                </div>
                {item.status === 'APROVADO' && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white rounded-full text-slate-900 hover:bg-orange-500 transition-colors" title="Download" onClick={() => window.open(item.url, '_blank')}>
                      <Download size={18} />
                    </button>
                    <button className="p-2 bg-white rounded-full text-slate-900 hover:bg-green-500 transition-colors" title="Compartilhar no WhatsApp">
                      <Share2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">{item.projectName}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">{item.type === 'book' ? 'Book Digital' : item.type === 'photo' ? 'Fotografia' : 'Vídeo'}</p>
                  {item.url !== '#' && <Link size={12} className="text-blue-500" />}
                </div>
                {item.createdBy && item.createdBy !== user.name && isAdmin && (
                   <p className="text-[10px] text-slate-400 mt-2 text-right">Por: {item.createdBy}</p>
                )}
              </div>
            </div>
          ))}
          
          {filteredContent.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
               <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                  <Search size={24} />
               </div>
               <p>Nenhum conteúdo encontrado.</p>
               <button onClick={() => setIsUploadModalOpen(true)} className="text-orange-500 text-sm font-bold mt-2 hover:underline">Adicionar novo conteúdo</button>
             </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <UploadCloud className="text-orange-500" size={24} />
                Adicionar Mídia
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Empreendimento</label>
                <input 
                  type="text" 
                  placeholder="Ex: Reserva Imperial"
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  value={uploadForm.projectName}
                  onChange={(e) => setUploadForm({...uploadForm, projectName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de Arquivo</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setUploadForm({...uploadForm, type: 'photo'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${uploadForm.type === 'photo' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-orange-300 text-slate-500'}`}
                  >
                    <ImageIcon size={24} />
                    <span className="text-xs font-bold">Foto</span>
                  </button>
                  <button 
                    onClick={() => setUploadForm({...uploadForm, type: 'video'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${uploadForm.type === 'video' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-orange-300 text-slate-500'}`}
                  >
                    <Video size={24} />
                    <span className="text-xs font-bold">Vídeo</span>
                  </button>
                  <button 
                    onClick={() => setUploadForm({...uploadForm, type: 'book'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${uploadForm.type === 'book' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-orange-300 text-slate-500'}`}
                  >
                    <BookOpen size={24} />
                    <span className="text-xs font-bold">PDF / Book</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Link Externo (Opcional)</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cole aqui o link do Drive, YouTube ou site..."
                    className="w-full pl-10 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    value={uploadForm.externalLink}
                    onChange={(e) => setUploadForm({...uploadForm, externalLink: e.target.value})}
                  />
                </div>
              </div>

              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-slate-100"></div>
                 <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-bold uppercase">Ou arquivo local</span>
                 <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Upload do Arquivo</label>
                <div 
                  onClick={() => setUploadForm({...uploadForm, fileSelected: true})}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadForm.fileSelected ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50'}`}
                >
                  {uploadForm.fileSelected ? (
                    <>
                      <CheckCircle2 size={40} className="text-green-500 mb-2" />
                      <p className="text-sm font-bold text-green-700">Arquivo carregado com sucesso!</p>
                      <p className="text-xs text-green-600">arquivo_exemplo.jpg (2.4MB)</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={40} className="text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">Clique para selecionar ou arraste aqui</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 ou PDF até 50MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
               <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
               >
                  Cancelar
               </button>
               <button 
                  onClick={handleUpload}
                  className="px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 flex items-center gap-2"
               >
                  {isAdmin ? (
                    <>
                      <CheckCircle2 size={18} /> Publicar Imediatamente
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} /> Enviar para Aprovação
                    </>
                  )}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
