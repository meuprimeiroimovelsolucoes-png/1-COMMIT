import React, { useState } from 'react';
import { MOCK_SALES } from '../constants';
import { CheckCircle2, Clock, DollarSign, MoreHorizontal, X } from 'lucide-react';

export const Crm: React.FC = () => {
  // State for tasks
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Ligar para cliente Maria (Pós-venda)', done: false, time: '10:00' },
    { id: 2, text: 'Reunião Construtora XYZ', done: true, time: '14:00' },
    { id: 3, text: 'Enviar simulação Pedro', done: false, time: '16:30' },
  ]);

  // State for modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ text: '', time: '' });

  const handleAddTask = () => {
    if (!newTask.text) return;
    
    const task = {
      id: Math.random(),
      text: newTask.text,
      time: newTask.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      done: false
    };

    setTasks([...tasks, task]);
    setNewTask({ text: '', time: '' });
    setShowTaskModal(false);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'contract_builder': return 'bg-blue-100 text-blue-700';
      case 'bank_analysis': return 'bg-orange-100 text-orange-700';
      case 'bank_signing': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'contract_builder': return 'Contrato Construtora';
      case 'bank_analysis': return 'Análise Bancária';
      case 'bank_signing': return 'Assinatura Banco';
      case 'completed': return 'Finalizado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 relative">
      <h2 className="text-2xl font-bold text-blue-950">Gestão & Vendas</h2>

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
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100"
              >
                <button className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-orange-500'}`}>
                  <CheckCircle2 size={14} />
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</p>
                  <p className="text-xs text-slate-400">{task.time}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                Nenhuma tarefa para hoje.
              </div>
            )}
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" /> Minhas Vendas
            </h3>
            <div className="flex gap-2">
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">3 Vendas Ativas</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Cliente / Imóvel</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {MOCK_SALES.map(sale => (
                  <tr key={sale.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="py-4 pl-2">
                      <p className="font-semibold text-slate-700">{sale.clientName}</p>
                      <p className="text-xs text-slate-500">{sale.propertyName}</p>
                    </td>
                    <td className="py-4 font-medium text-slate-700">
                      R$ {sale.value.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(sale.status)}`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Add Task Modal */}
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