import React, { useState } from 'react';
import { Building2, Lock, Mail, ArrowRight, Loader2, UserPlus, LogIn, KeyRound, AlertTriangle, ExternalLink, RotateCcw } from 'lucide-react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // States for API Key Recovery
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Erro de autenticação:", err);
      setIsLoading(false);
      
      const errorCode = (err.code || '').toLowerCase();
      const errorMessage = (err.message || '').toLowerCase();
      const errString = JSON.stringify(err).toLowerCase();

      // Check specifically for API Key errors
      if (
        errorCode.includes('api-key') || 
        errorMessage.includes('api-key') || 
        errString.includes('api-key') ||
        errorCode.includes('auth/configuration-not-found')
      ) {
        setShowApiKeyInput(true);
        setError('A Chave de API configurada é inválida ou expirou.');
        return;
      }

      let msg = 'Erro ao conectar.';
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-login-credentials' || errorCode === 'auth/invalid-credential') {
        msg = 'E-mail não encontrado ou senha incorreta.';
      } else if (errorCode === 'auth/wrong-password') {
        msg = 'Senha incorreta.';
      } else if (errorCode === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado.';
      } else if (errorCode === 'auth/weak-password') {
        msg = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (errorCode === 'auth/network-request-failed') {
        msg = 'Erro de conexão. Verifique sua internet.';
      } else if (err.message) {
        msg = `Erro: ${err.message}`;
      }
      
      setError(msg);
    }
  };

  const handleSaveApiKey = () => {
    if (!newApiKey) return;
    const cleanKey = newApiKey.replace(/['"]/g, '').trim();
    localStorage.setItem('imobmaster_firebase_key', cleanKey);
    window.location.reload();
  };

  const handleResetApiKey = () => {
    localStorage.removeItem('imobmaster_firebase_key');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-blue-950 p-8 text-center transition-all relative overflow-hidden">
          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Meu primeiro imóvel</h1>
            <p className="text-blue-200 text-sm mt-1">
              {isSignUp ? 'Crie sua conta de acesso' : 'Plataforma Inteligente para Imobiliárias'}
            </p>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        </div>

        {/* Form Area */}
        <div className="p-8 pt-6">
          
          {/* API Key Recovery Mode */}
          {showApiKeyInput ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="text-center mb-3">
                  <AlertTriangle className="mx-auto text-orange-500 mb-2" size={32} />
                  <h3 className="font-bold text-orange-800">Chave de API Inválida</h3>
                </div>
                
                <div className="text-xs text-orange-900 bg-orange-100/50 p-3 rounded-lg border border-orange-100">
                  <p className="font-bold mb-2 flex items-center gap-1">
                    Provável Causa:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Você pode ter copiado a chave com aspas <code>"..."</code>.</li>
                    <li>A chave salva no navegador está incorreta.</li>
                  </ul>
                  <p className="mt-2 font-medium">Tente clicar em "Restaurar Configuração Original" abaixo.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nova API Key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    placeholder="Cole a chave aqui (Ex: AIzaSy...)"
                    value={newApiKey}
                    onChange={e => setNewApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={handleSaveApiKey}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Salvar Correção
                </button>

                <button 
                  onClick={handleResetApiKey}
                  className="w-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> Restaurar Configuração Original
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setShowApiKeyInput(false);
                  setError('');
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="password" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="password" 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-start gap-2 animate-in fade-in">
                  <div className="mt-0.5 font-bold">!</div>
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group mt-2"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Criar Conta' : 'Acessar Sistema'} 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
          
          {!showApiKeyInput && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-2">
                {isSignUp ? 'Já possui cadastro?' : 'Não tem conta?'}
              </p>
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setConfirmPassword('');
                }}
                className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto text-sm"
              >
                {isSignUp ? (
                  <>
                    <LogIn size={16} /> Voltar para Login
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Cadastre-se agora
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};