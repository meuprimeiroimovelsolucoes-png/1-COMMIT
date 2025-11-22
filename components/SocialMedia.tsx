
import React, { useState, useEffect } from 'react';
import { SocialPost, User } from '../types';
import { Calendar as CalendarIcon, Instagram, Plus, Wand2, Image as ImageIcon, X, CheckCircle2, AlertCircle, ShieldCheck, Check, Trash2, Clock, Loader2 } from 'lucide-react';
import { generateCaption } from '../services/geminiService';
import { db } from '../services/firebase';
import { collection, addDoc, query, onSnapshot, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';

interface SocialMediaProps {
  user: User;
}

export const SocialMedia: React.FC<SocialMediaProps> = ({ user }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({
    date: '',
    topic: '',
    caption: '',
    platform: 'instagram_feed'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const isAdmin = user.role === 'gestor' || user.role === 'admin';

  // --- FIRESTORE SUBSCRIPTION ---
  useEffect(() => {
    const q = query(collection(db, 'social_posts'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(snapshotDoc => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
      })) as SocialPost[];
      setPosts(fetchedPosts);
      setIsLoadingData(false);
    });
    return () => unsubscribe();
  }, []);

  // Simple calendar grid generation
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleGenerateCaption = async () => {
    if (!newPost.topic) return alert("Digite um tema para a legenda.");
    setIsGenerating(true);
    const caption = await generateCaption(newPost.topic);
    setNewPost({ ...newPost, caption });
    setIsGenerating(false);
  };

  const handleSavePost = async () => {
    if (!newPost.topic || !newPost.date) return alert("Preencha data e tema.");

    const status = isAdmin ? 'scheduled' : 'pending_approval';

    const postData = {
      date: newPost.date,
      platform: newPost.platform,
      content: newPost.topic,
      caption: newPost.caption,
      status: status,
      createdBy: user.name,
      createdAt: new Date().toISOString()
    };

    try {
       await addDoc(collection(db, 'social_posts'), postData);
       setShowModal(false);
       setNewPost({ date: '', topic: '', caption: '', platform: 'instagram_feed' });
       if (!isAdmin) alert("Post enviado para aprovação da gestão!");
    } catch (error) {
       console.error("Erro ao salvar post", error);
       alert("Erro ao agendar post.");
    }
  };

  const handleApprove = async (id: string) => {
    try {
       await updateDoc(doc(db, 'social_posts', id), { status: 'scheduled' });
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id: string) => {
    if(confirm("Deseja rejeitar este agendamento?")) {
       try {
          await deleteDoc(doc(db, 'social_posts', id)); // Or update status to 'rejected'
       } catch (e) { console.error(e); }
    }
  };

  // Filter Posts Logic
  const visiblePosts = posts.filter(p => {
    if (reviewMode && isAdmin) return p.status === 'pending_approval';
    // Broker sees: Approved/Scheduled posts OR their own posts
    if (isAdmin) return true;
    return p.status === 'scheduled' || p.status === 'posted' || (p.createdBy === user.name);
  });

  const pendingCount = posts.filter(p => p.status === 'pending_approval').length;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled': return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Agendado</span>;
      case 'posted': return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Postado</span>;
      case 'pending_approval': return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Clock size={10} /> Em Análise</span>;
      case 'rejected': return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Rejeitado</span>;
      default: return null;
    }
  };

  if (isLoadingData) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
             Social Media Planner
             {isAdmin && pendingCount > 0 && !reviewMode && (
                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                   <AlertCircle size={12} /> {pendingCount}
                </span>
             )}
           </h2>
           <p className="text-slate-500 text-sm">Agende lembretes e crie legendas com IA.</p>
        </div>
        
        <div className="flex gap-3">
           {isAdmin && (
             <button 
               onClick={() => setReviewMode(!reviewMode)}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border flex items-center gap-2 ${reviewMode ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
             >
               <ShieldCheck size={16} />
               {reviewMode ? 'Voltar ao Calendário' : 'Aprovar Posts'}
             </button>
           )}
           
           {!reviewMode && (
             <button 
               onClick={() => setShowModal(true)}
               className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
             >
               <Plus size={18} /> Agendar Post
             </button>
           )}
        </div>
      </div>

      {reviewMode && isAdmin ? (
        // REVIEW MODE LIST
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
           <div className="p-4 bg-orange-50 border-b border-orange-100 text-orange-800 font-bold text-sm flex items-center gap-2">
              <AlertCircle size={18} /> Posts Aguardando Aprovação ({visiblePosts.length})
           </div>
           <div className="divide-y divide-slate-100">
              {visiblePosts.length > 0 ? visiblePosts.map(post => (
                 <div key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 gap-4">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400">
                          <ImageIcon size={20} />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-bold text-slate-500 uppercase">{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                             <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-600 rounded border border-pink-100 font-medium">
                               {post.platform === 'instagram_story' ? 'Story' : 'Feed'}
                             </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">{post.content}</h4>
                          <p className="text-xs text-slate-500 mt-1">Por: <span className="font-semibold">{post.createdBy || 'Desconhecido'}</span></p>
                          {post.caption && (
                             <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600 italic">
                                "{post.caption.substring(0, 100)}{post.caption.length > 100 ? '...' : ''}"
                             </div>
                          )}
                       </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                       <button 
                         onClick={() => handleReject(post.id)}
                         className="px-3 py-2 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-2 transition-colors"
                       >
                         <Trash2 size={14} /> Rejeitar
                       </button>
                       <button 
                         onClick={() => handleApprove(post.id)}
                         className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                       >
                         <Check size={14} /> Aprovar
                       </button>
                    </div>
                 </div>
              )) : (
                 <div className="p-12 text-center text-slate-400">
                    <CheckCircle2 size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Tudo em dia! Nenhum post pendente.</p>
                 </div>
              )}
           </div>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {days.slice(0, 14).map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                // Show posts for this date that are VISIBLE (Scheduled, Posted, or MY Pending)
                const dayPosts = visiblePosts.filter(p => p.date === dateStr);
                const isToday = idx === 0;

                return (
                  <div key={idx} className={`min-h-[120px] border rounded-xl p-2 flex flex-col gap-2 transition-colors ${isToday ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:border-orange-300'}`}>
                    <div className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                      <span>{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className={isToday ? 'text-blue-600' : ''}>{date.getDate()}</span>
                    </div>
                    
                    {dayPosts.map(post => (
                      <div key={post.id} className={`p-2 rounded border shadow-sm text-xs cursor-pointer transition-colors ${post.status === 'pending_approval' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' : 'bg-white border-slate-200 hover:border-orange-500'}`}>
                        <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-1 text-pink-600 font-bold">
                             <Instagram size={10} /> 
                             <span>{post.platform === 'instagram_story' ? 'Story' : 'Feed'}</span>
                           </div>
                           {post.status === 'pending_approval' && <div className="w-2 h-2 rounded-full bg-yellow-500" title="Em Análise"></div>}
                        </div>
                        <p className="text-slate-700 truncate">{post.content}</p>
                      </div>
                    ))}
                    
                    {/* Add button */}
                    <button 
                      onClick={() => {
                        setNewPost({...newPost, date: dateStr});
                        setShowModal(true);
                      }}
                      className="mt-auto w-full py-1 rounded bg-slate-50 text-slate-400 hover:bg-slate-100 text-xs font-medium"
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Posts List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4">Próximos Posts (Lista)</h3>
            <div className="space-y-4">
              {visiblePosts.filter(p => new Date(p.date) >= new Date()).slice(0, 5).map(post => (
                <div key={post.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all bg-slate-50/50 items-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400">
                      {post.imagePlaceholder ? <img src={post.imagePlaceholder} className="w-full h-full object-cover rounded-lg opacity-75" /> : <ImageIcon size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 text-xs font-bold">
                              {post.platform === 'instagram_story' ? 'Story' : 'Feed'}
                            </span>
                            {getStatusBadge(post.status)}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(post.date).toLocaleDateString('pt-BR')}
                          </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{post.content}</h4>
                      {post.createdBy && <p className="text-xs text-slate-400 mt-0.5">Criado por: {post.createdBy}</p>}
                    </div>
                </div>
              ))}
              {visiblePosts.length === 0 && (
                <p className="text-sm text-slate-400 italic">Nenhum post futuro agendado.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-blue-950">
                 {isAdmin ? 'Novo Agendamento' : 'Solicitar Agendamento'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
                   <input 
                      type="date" 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={newPost.date}
                      onChange={e => setNewPost({...newPost, date: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Formato</label>
                   <select 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={newPost.platform}
                      onChange={e => setNewPost({...newPost, platform: e.target.value})}
                   >
                      <option value="instagram_feed">Feed (Foto/Carrossel)</option>
                      <option value="instagram_story">Story</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Tema / Lembrete Visual</label>
                   <textarea 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="Ex: Foto da fachada do empreendimento X..."
                      value={newPost.topic}
                      onChange={e => setNewPost({...newPost, topic: e.target.value})}
                   />
                   <p className="text-[10px] text-slate-400 mt-1">Descreva a imagem que você pretende usar.</p>
                </div>
              </div>

              <div className="flex flex-col h-full">
                <label className="block text-sm font-medium text-slate-600 mb-1">Legenda (Gerada por IA)</label>
                <div className="flex-1 relative">
                   <textarea 
                      className="w-full h-full p-3 border border-slate-200 rounded-lg text-sm resize-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                      placeholder="Use o botão abaixo para gerar uma legenda criativa..."
                      value={newPost.caption}
                      onChange={e => setNewPost({...newPost, caption: e.target.value})}
                   />
                   <button 
                      onClick={handleGenerateCaption}
                      disabled={isGenerating}
                      className="absolute bottom-3 right-3 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                   >
                      <Wand2 size={14} /> {isGenerating ? 'Gerando...' : 'Gerar Legenda'}
                   </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
               <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
               >
                  Cancelar
               </button>
               <button 
                  onClick={handleSavePost}
                  className="px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 flex items-center gap-2"
               >
                  {isAdmin ? <Check size={18} /> : <ShieldCheck size={18} />}
                  {isAdmin ? 'Agendar Post' : 'Enviar para Aprovação'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
