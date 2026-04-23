
import React, { useState } from 'react';
import { XMarkIcon, Cog6ToothIcon, PlusIcon, TagIcon, TrashIcon } from './Icons';
import type { Profile } from '../types';
import { supabase } from '../services/supabase';

interface SettingsModalProps {
  onClose: () => void;
  readingGoal: number;
  onSetReadingGoal: (val: number) => void;
  profile: Profile | null;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  readingGoal, 
  onSetReadingGoal,
  profile,
  onUpdateProfile
}) => {
  const [localGoal, setLocalGoal] = useState(readingGoal);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>(profile?.customTags || []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        onSetReadingGoal(localGoal);
        const updates: Partial<Profile> = {
            fullName,
            customTags
        };
        await onUpdateProfile(updates);
        if (!passwordMessage || passwordMessage.type === 'success') {
            onClose();
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !customTags.includes(val)) {
        setCustomTags([...customTags, val]);
        setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
        setPasswordMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
        return;
    }

    if (newPassword !== confirmPassword) {
        setPasswordMessage({ text: 'As senhas não coincidem.', type: 'error' });
        return;
    }

    setPasswordLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setPasswordMessage({ text: 'Senha atualizada com sucesso!', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        setPasswordMessage({ text: error.message || 'Erro ao atualizar senha.', type: 'error' });
    } finally {
        setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="bg-tertiary/10 p-2 rounded-xl">
              <Cog6ToothIcon className="h-5 w-5 text-tertiary" />
            </div>
            <h2 className="text-xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">Preferências</h2>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all hover:rotate-90">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <section className="space-y-4">
             <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 ml-1">Perfil do Leitor</label>
             <input 
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-200 transition-all"
             />
          </section>

          {/* Gerenciamento de Tags */}
          <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-tertiary" />
                    <h3 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Minhas Tags Personalizadas</h3>
                </div>
             </div>
             
             <div className="flex gap-2">
                <input 
                    type="text"
                    placeholder="Nome da tag (ex: Favoritos)"
                    value={tagInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                        }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-sm"
                />
                <button 
                    onClick={addTag}
                    className="px-4 bg-primary text-white rounded-xl hover:bg-slate-900 transition-all active:scale-95"
                >
                    <PlusIcon className="h-5 w-5" />
                </button>
             </div>

             <div className="flex flex-wrap gap-2 pt-2">
                {customTags.length > 0 ? (
                    customTags.map(tag => (
                        <div key={tag} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{tag}</span>
                            <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-[9px] font-bold text-slate-400 italic uppercase tracking-widest px-1">Nenhuma tag criada ainda.</p>
                )}
             </div>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <h3 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Segurança e Senha</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nova Senha</p>
                    <input 
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-medium dark:text-white transition-all shadow-sm"
                    />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirmar Senha</p>
                    <input 
                        type="password"
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-medium dark:text-white transition-all shadow-sm"
                    />
                </div>
                
                {passwordMessage && (
                    <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-top-2 ${
                        passwordMessage.type === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400'
                    }`}>
                        {passwordMessage.text}
                    </div>
                )}

                <button 
                    onClick={handleUpdatePassword}
                    disabled={passwordLoading || !newPassword}
                    className="w-full py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                    {passwordLoading ? 'Processando...' : 'Atualizar Senha'}
                </button>
            </div>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Meta de Leitura Anual</h3>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Livros desejados este ano</p>
              </div>
              <span className="text-3xl font-black text-primary">{localGoal}</span>
            </div>
            <input 
              type="range" min="1" max="100" value={localGoal}
              onChange={(e) => setLocalGoal(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </section>
        </div>

        <div className="p-7 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
          <button 
            onClick={handleSave} disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};
