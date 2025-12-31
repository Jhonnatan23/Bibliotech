
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
  
  const currentKey = (supabase as any).supabaseKey || '';
  const isStripeKey = currentKey.startsWith('sb_');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setHighlightSignup(false);

    if (isStripeKey) {
        setErrorMsg("Erro de Configuração: Você está usando uma chave do Stripe (começa com 'sb_'). O login só funciona com a chave 'anon public' do Supabase (começa com 'eyJ').");
        setLoading(false);
        return;
    }

    try {
      if (mode === 'login') {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Supabase Login Error:", error);
          
          if (error.message.toLowerCase().includes('invalid login credentials') || error.status === 400 || error.status === 401) {
             setHighlightSignup(true);
             throw new Error('E-mail ou senha incorretos. Verifique seus dados ou crie uma conta nova se for seu primeiro acesso!');
          }
          
          if (error.message.toLowerCase().includes('email not confirmed')) {
             throw new Error('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou spam para ativar sua conta.');
          }

          throw error;
        }
      } else {
        if (password.length < 6) throw new Error('A senha precisa ter no mínimo 6 caracteres.');
        if (fullName.trim().length < 3) throw new Error('Por favor, informe seu nome completo.');
        
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName.trim() } }
        });
        
        if (error) {
            if (error.message.toLowerCase().includes('user already registered')) {
                setMode('login');
                throw new Error('Este e-mail já está cadastrado. Tente fazer login!');
            }
            throw error;
        }
        
        if (data.user && !data.session) {
           setNeedsEmailConfirmation(true);
        }
      }
    } catch (error: any) {
      console.error("Auth Component Error:", error);
      setErrorMsg(error.message || "Ocorreu um erro inesperado. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
        setErrorMsg("Digite seu e-mail primeiro para recuperar a senha.");
        return;
    }
    setLoading(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setErrorMsg("Link de recuperação enviado para seu e-mail!");
    } catch (error: any) {
        setErrorMsg(error.message);
    } finally {
        setLoading(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-emerald-100 dark:border-emerald-900/30 p-10 text-center animate-in zoom-in duration-500">
          <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-4 font-serif italic">Verifique seu E-mail!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
            Enviamos um link de confirmação para <b>{email}</b>. <br/> 
            Verifique sua caixa de entrada (e spam) para ativar sua conta e começar a usar o BiblioTech.
          </p>
          <button 
            onClick={() => setNeedsEmailConfirmation(false)}
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all shadow-md"
          >
            Voltar para a tela de Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 transition-all relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-10 pt-4">
            <Logo size="lg" className="mb-6" showText={true} />
            
            <div className="flex w-full bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => { setMode('login'); setErrorMsg(null); }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Entrar
                </button>
                <button 
                    onClick={() => { setMode('signup'); setErrorMsg(null); }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'} ${highlightSignup ? 'animate-pulse ring-2 ring-primary/20' : ''}`}
                >
                    Cadastrar
                </button>
            </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {mode === 'signup' && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Como devemos te chamar?</label>
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">E-mail de Acesso</label>
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Senha de Segurança</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[9px] font-bold text-primary uppercase hover:underline">
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
            <div className={`p-5 rounded-2xl border animate-shake space-y-4 ${errorMsg.includes('enviado') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-900/30'}`}>
              <p className="text-[10px] font-bold uppercase leading-relaxed">{errorMsg}</p>
              {highlightSignup && mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(null); }}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl text-[9px] tracking-widest shadow-md hover:bg-blue-700 transition-all font-black uppercase"
                  >
                    NÃO TENHO CONTA, CRIAR AGORA!
                  </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl shadow-xl hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar no BiblioTech' : 'Criar minha conta'}
          </button>
          
          {mode === 'login' && (
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="w-full text-center text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 text-center flex flex-col gap-4">
            <button 
                onClick={() => setShowHelp(true)}
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
            >
                Ajuda com Acesso ou Banco de Dados
            </button>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-white/20 relative animate-in zoom-in duration-300">
                <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><XMarkIcon className="h-5 w-5"/></button>
                <h3 className="text-2xl font-black font-serif italic mb-6">Guia de Solução:</h3>
                
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">• <b>Erro de Credenciais:</b> Certifique-se de que se cadastrou primeiro. No Supabase, se você cadastrou e não confirmou o e-mail, o login falhará.</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">• <b>Confirmação de E-mail:</b> Verifique seu spam. O link expira em algumas horas.</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">• <b>Erro 403 (IA):</b> A geração de capas profissionais (Gemini Pro) exige uma chave de API válida com faturamento ativado ou créditos no Google AI Studio.</p>
                </div>
                
                <button 
                    onClick={() => setShowHelp(false)}
                    className="w-full bg-primary text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl mt-8 shadow-xl active:scale-95"
                >
                    Entendido!
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
