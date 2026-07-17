
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Logo } from './Logo';
import { XMarkIcon } from './Icons';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [highlightSignup, setHighlightSignup] = useState(false);
  
  useEffect(() => {
    setErrorMsg(null);
    setHighlightSignup(false);
  }, [mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setHighlightSignup(false);

    try {
      if (mode === 'login') {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          handleAuthError(error);
          return;
        }
      } else {
        if (password.length < 6) {
          setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }
        if (fullName.trim().length < 3) {
          setErrorMsg('Informe seu nome completo.');
          setLoading(false);
          return;
        }
        
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName.trim() } }
        });
        
        if (error) {
            handleAuthError(error);
            return;
        }
        
        if (data.user && !data.session) {
           setNeedsEmailConfirmation(true);
        }
      }
    } catch (error: any) {
      if (error.message?.includes('fetch') || error instanceof TypeError) {
        setErrorMsg("❌ Falha de Rede: Não foi possível alcançar o Supabase. Verifique se o projeto não foi PAUSADO no dashboard ou se você tem internet.");
      } else {
        setErrorMsg("Erro de autenticação. Tente novamente em alguns instantes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('failed to fetch') || msg.includes('network error')) {
        setErrorMsg("❌ Erro de Rede Crítico: Servidor inacessível. O projeto Supabase pode estar pausado por inatividade.");
    } else if (msg.includes('invalid login credentials')) {
        setHighlightSignup(true);
        setErrorMsg('Login inválido. Se este é seu primeiro acesso, você deve CADASTRAR uma conta primeiro!');
    } else if (msg.includes('email not confirmed')) {
        setErrorMsg('E-mail não confirmado. Verifique seu lixo eletrônico para o link de ativação.');
    } else {
        setErrorMsg(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
        setErrorMsg("Digite seu e-mail para recuperar a senha.");
        return;
    }
    setLoading(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setErrorMsg("E-mail de recuperação enviado!");
    } catch (error: any) {
        handleAuthError(error);
    } finally {
        setLoading(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-emerald-100 dark:border-emerald-900/30">
          <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black mb-4 font-serif italic">Verifique seu E-mail</h2>
          <p className="text-slate-500 text-sm mb-8">Enviamos um link para <b>{email}</b> para confirmar sua conta.</p>
          <button onClick={() => setNeedsEmailConfirmation(false)} className="w-full py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 transition-all relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-10 pt-4">
            <Logo size="lg" className="mb-6" showText={true} />
            
            <div className="flex w-full bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => setMode('login')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400'}`}
                >
                    Entrar
                </button>
                <button 
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400'} ${highlightSignup ? 'animate-pulse ring-2 ring-primary text-primary' : ''}`}
                >
                    Cadastrar
                </button>
            </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {mode === 'signup' && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nome Completo</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-medium dark:text-white transition-all shadow-sm"
                required={mode === 'signup'}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">E-mail</label>
            <input
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-medium dark:text-white transition-all shadow-sm"
              required
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Senha</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[9px] font-bold text-tertiary uppercase hover:underline">
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-medium dark:text-white transition-all shadow-sm"
              required
            />
          </div>

          {errorMsg && (
            <div className={`p-4 rounded-2xl border animate-shake bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-900/30`}>
              <p className="text-[10px] font-bold uppercase leading-relaxed text-center">{errorMsg}</p>
              {highlightSignup && mode === 'login' && (
                  <button type="button" onClick={() => setMode('signup')} className="w-full mt-3 bg-blue-600 text-white py-2 rounded-xl text-[9px] font-black uppercase">Criar Conta Agora</button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl shadow-xl hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Acessando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
          
          {mode === 'login' && (
              <button type="button" onClick={handleForgotPassword} className="w-full text-center text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Esqueci minha senha</button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 text-center">
            <button onClick={() => setShowHelp(true)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Ajuda com Acesso</button>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-white/20 relative animate-in zoom-in duration-300">
                <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-all"><XMarkIcon className="h-5 w-5"/></button>
                <h3 className="text-2xl font-black font-serif italic mb-6">Problemas de Rede?</h3>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">• Se receber "Failed to fetch", o projeto no Supabase pode estar <b>PAUSADO</b> por inatividade.</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">• Acesse o painel do Supabase e certifique-se que o projeto está "Active".</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">• Verifique se sua internet não está bloqueando o domínio do Supabase.</p>
                </div>
                <button onClick={() => setShowHelp(false)} className="w-full bg-primary text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl mt-8 shadow-xl">Entendido</button>
            </div>
        </div>
      )}
    </div>
  );
};
