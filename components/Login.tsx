
import React, { useState } from 'react';
import { Building2, Lock, Mail, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        // Criar conta
        await createUserWithEmailAndPassword(auth, email, password);
        // O App.tsx vai detectar o novo usuário e criar o perfil no Firestore automaticamente
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Sucesso: O onAuthStateChanged no App.tsx cuida do resto
    } catch (err: any) {
      console.error("Erro de autenticação:", err);
      
      // Tratamento de erros mais detalhado
      let msg = 'Erro ao conectar.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/invalid-credential') {
        msg = 'E-mail não encontrado ou senha incorreta.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Senha incorreta.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Erro de conexão. Verifique sua internet.';
      } else if (err.message) {
        msg = `Erro: ${err.message}`;
      }
      
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header / Logo Area */}
        <div className="bg-blue-950 p-8 text-center transition-all">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ImobMaster AI</h1>
          <p className="text-blue-200 text-sm mt-1">
            {isSignUp ? 'Crie sua conta de acesso' : 'Plataforma Inteligente para Imobiliárias'}
          </p>
        </div>

        {/* Form Area */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password (Only for Sign Up) */}
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

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                <div className="mt-0.5 font-bold">!</div>
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button */}
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
          
          {/* Toggle Sign Up / Login */}
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
        </div>
      </div>
    </div>
  );
};
