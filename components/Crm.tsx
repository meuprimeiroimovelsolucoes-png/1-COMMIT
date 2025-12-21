import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, DollarSign, MoreHorizontal, X, Loader2, Plus, Building2, Calendar, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import { User, Lead, NegotiationStage } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';

interface CrmProps {
  user: User;
}

interface Task {
  id: string;
  text: string;
  time: string;
  done: boolean;
  userId: string;
}

export const Crm: React.FC<CrmProps> = ({ user }) => {
  // State for data
  const [sales, setSales] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // State for modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  
  const [newTask, setNewTask] = useState({ text: '', time: '' });
  const [isSavingSale, setIsSavingSale] = useState(false);

  // Sale Registration Form State
  const [saleForm, setSaleForm] = useState({
    brokerName: 'Keyla', // Default value
    clientName: '',
    clientPhone: '',
    developmentName: '',
    propertyValue: '',
    invoiceValue: '',
    stage: 'contrato_construtora_assinado' as NegotiationStage,
    saleDate: new Date().toISOString().split('T')[0]
  });

  // Lista de corretores para escolha
  const BROKERS_LIST = ['Keyla', 'Natalia', 'Joao', 'Outro'];

  // --- FIRESTORE SUBSCRIPTION ---
  useEffect(() => {
    setLoading(true);
    const leadsRef = collection(db, 'leads');
    let salesQuery = query(leadsRef, where('status', '==', 'vendido'));
    
    // Filtro removido para que o gestor/corretor possa ver todas as vendas cadastradas pelos nomes escolhidos
    // if (user.role === 'corretor') {
    //   salesQuery = query(leadsRef, where('status', '==', 'vendido'), where('assignedTo', '==', user.id));
    // }

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(snapshotDoc => {
        const data = snapshotDoc.data();
        return { 
          id: snapshotDoc.id, 
          ...data,
          created_at: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.created_at
        } as Lead;
      });
      setSales(salesData.sort((a, b) => new Date(b.saleDetails?.saleDate || '').getTime() - new Date(a.saleDetails?.saleDate || '').getTime()));
    });

    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(tasksRef, where('userId', '==', user.id));
    
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
       const tasksData = snapshot.docs.map(snapshotDoc => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as Task));
       setTasks(tasksData);
       setLoading(false);
    });

    return () => {
      unsubSales();
      unsubTasks();
    };
  }, [user.id]);


  const handleAddTask = async () => {
    if (!newTask.text) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTask.text,
        time: newTask.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        done: false,
        userId: user.id,
        createdAt: Timestamp.now()
      });
      setNewTask({ text: '', time: '' });
      setShowTaskModal(false);
    } catch (error) {
      console.error("Erro ao salvar tarefa", error);
    }
  };

  const handleRegisterSale = async () => {
    if (!saleForm.clientName || !saleForm.developmentName || !saleForm.propertyValue) {
      alert("Por favor, preencha os dados obrigatórios da venda.");
      return;
    }

    setIsSavingSale(true);
    try {
      const saleData = {
        name: saleForm.clientName,
        phone: saleForm.clientPhone || 'Não informado',
        status: 'vendido',
        assignedTo: saleForm.brokerName, // Salva o nome do corretor escolhido
        createdBy: user.name,
        createdAt: Timestamp.now(),
        saleDetails: {
          propertyValue: parseFloat(saleForm.propertyValue.replace(/\D/g, '')) / 100 || 0,
          invoiceValue: parseFloat(saleForm.invoiceValue.replace(/\D/g, '')) / 100 || 0,
          developmentName: saleForm.developmentName,
          stage: saleForm.stage,
          saleDate: saleForm.saleDate,
          notes: `Venda registrada para ${saleForm.brokerName}`
        }
      };

      await addDoc(collection(db, 'leads'), saleData);
      setShowSaleModal(false);
      setSaleForm({
        brokerName: 'Keyla',
        clientName: '',
        clientPhone: '',
        developmentName: '',
        propertyValue: '',
        invoiceValue: '',
        stage: 'contrato_construtora_assinado',
        saleDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      alert("Erro ao salvar venda. Tente novamente.");
    } finally {
      setIsSavingSale(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { done: !task.done });
    } catch (error) {
      console.error("Erro ao atualizar tarefa", error);
    }
  };

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    let value = val.replace(/\D/g, '');
    if (!value) return setter('');
    const numberValue = parseInt(value) / 100;
    setter(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const getStatusColor = (status: NegotiationStage) => {
    switch(status) {
      case 'contrato_construtora_assinado': return 'bg-blue-100 text-blue-700';
      case 'aguardando_assinatura_caixa': return 'bg-orange-100 text-orange-700';
      case 'contrato_caixa_assinado': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: NegotiationStage) => {
    switch(status) {
      case 'contrato_construtora_assinado': return 'Contrato Construtora';
      case 'aguardando_assinatura_caixa': return 'Aguardando Banco';
      case 'contrato_caixa_assinado': return 'Assinatura Banco';
      default: return (status as string)?.replace(/_/g, ' ') || '-';
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-950">Gestão & Vendas</h2>
        <button 
          onClick={() => setShowSaleModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-green-600/20 transition-all transform hover:scale-105"
        >
          <Plus size={18} /> Registrar Venda
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda / Tasks */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" /> Agenda do Dia
            </h3>
            <button 
              onClick={() => setShowTaskModal(true)}
              className="text-sm text-orange-600 font-medium hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors"
            >
              + Nova Tarefa
            </button>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-500"/></div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <button className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-orange-500'}`}>
                    <CheckCircle2 size={14} />
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</p>
                    <p className="text-xs text-slate-400">{task.time}</p>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  Nenhuma tarefa para hoje.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sales Pipeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" /> Minhas Vendas
            </h3>
            <div className="flex gap-2">
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{sales.length} Vendas Ativas</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Corretor / Cliente</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sales.length === 0 && !loading && (
                   <tr>
                     <td colSpan={4} className="py-8 text-center text-slate-400 italic">Nenhuma venda registrada ainda.</td>
                   </tr>
                )}
                {sales.map(sale => (
                  <tr key={sale.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <UserIcon size={12} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">{sale.name}</p>
                          <p className="text-[10px] text-orange-600 font-bold uppercase">Corretor: {sale.assignedTo || 'Sistema'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-medium text-slate-700">
                      {sale.saleDetails?.propertyValue ? `R$ ${sale.saleDetails.propertyValue.toLocaleString('pt-BR')}` : '-'}
                    </td>
                    <td className="py-4">
                      {sale.saleDetails?.stage && (
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(sale.saleDetails.stage)}`}>
                          {getStatusLabel(sale.saleDetails.stage)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-slate-500">
                      {sale.saleDetails?.saleDate ? new Date(sale.saleDetails.saleDate).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Sale Registration Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <DollarSign className="text-green-600" /> Registrar Novo Fechamento
              </h3>
              <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Broker Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Corretor Responsável *</label>
                  <div className="relative">
                    <UsersIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      className="w-full pl-10 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      value={saleForm.brokerName}
                      onChange={e => setSaleForm({...saleForm, brokerName: e.target.value})}
                    >
                      {BROKERS_LIST.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Cliente *</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full pl-10 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Nome completo"
                      value={saleForm.clientName}
                      onChange={e => setSaleForm({...saleForm, clientName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp do Cliente</label>
                  <input 
                    className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="11999999999"
                    value={saleForm.clientPhone}
                    onChange={e => setSaleForm({...saleForm, clientPhone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Empreendimento *</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full pl-10 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Reserva Imperial"
                      value={saleForm.developmentName}
                      onChange={e => setSaleForm({...saleForm, developmentName: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Imóvel *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                    <input 
                      className="w-full pl-10 p-3 rounded-lg border border-slate-200 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                      value={saleForm.propertyValue}
                      onChange={e => handleCurrencyInput(e.target.value, (v) => setSaleForm({...saleForm, propertyValue: v}))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor da Nota (Comissão Bruta)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                    <input 
                      className="w-full pl-10 p-3 rounded-lg border border-slate-200 font-bold text-green-700 outline-none focus:ring-2 focus:ring-green-500"
                      value={saleForm.invoiceValue}
                      onChange={e => handleCurrencyInput(e.target.value, (v) => setSaleForm({...saleForm, invoiceValue: v}))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Etapa Atual</label>
                  <select 
                    className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    value={saleForm.stage}
                    onChange={e => setSaleForm({...saleForm, stage: e.target.value as NegotiationStage})}
                  >
                    <option value="contrato_construtora_assinado">Contrato Construtora Assinado</option>
                    <option value="aguardando_assinatura_caixa">Aguardando Assinatura Caixa</option>
                    <option value="contrato_caixa_assinado">Contrato Caixa Assinado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data da Venda</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date"
                      className="w-full pl-10 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500"
                      value={saleForm.saleDate}
                      onChange={e => setSaleForm({...saleForm, saleDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowSaleModal(false)}
                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRegisterSale}
                disabled={isSavingSale}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {isSavingSale ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                Confirmar Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Task Modal logic kept for brevity... */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-blue-950">Nova Tarefa</h3>
                  <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full transition-colors">
                    <X size={20}/>
                  </button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                    <input
                       className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                       placeholder="Ex: Ligar para cliente..."
                       value={newTask.text}
                       onChange={e => setNewTask({...newTask, text: e.target.value})}
                       autoFocus
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horário</label>
                    <input
                       type="time"
                       className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                       value={newTask.time}
                       onChange={e => setNewTask({...newTask, time: e.target.value})}
                    />
                 </div>
                 <button
                    onClick={handleAddTask}
                    disabled={!newTask.text}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 mt-2 transition-all"
                 >
                    Adicionar à Agenda
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};