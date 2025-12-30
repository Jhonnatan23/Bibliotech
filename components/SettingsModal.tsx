
import React, { useState } from 'react';
import { XMarkIcon, Cog6ToothIcon } from './Icons';
import type { Profile } from '../types';

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
        onSetReadingGoal(localGoal);
        if (fullName !== profile?.fullName) {
            await onUpdateProfile({ fullName: fullName });
        }
        onClose();
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Cog6ToothIcon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">Preferências</h2>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all hover:rotate-90">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <section className="space-y-4">
             <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 ml-1">Perfil do Leitor</label>
             <input 
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-200 transition-all"
             />
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Meta de Leitura Anual</h3>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Quantos livros deseja ler este ano?</p>
              </div>
              <span className="text-3xl font-black text-primary">{localGoal}</span>
            </div>
            
            <div className="space-y-4">
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={localGoal}
                onChange={(e) => setLocalGoal(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                <span>1 Livro</span>
                <span>50</span>
                <span>100 Livros</span>
              </div>
            </div>
          </section>

          <div className="p-5 bg-blue-50/40 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed font-bold uppercase tracking-tight">
              ✦ Dica: Manter uma meta realista ajuda a manter a motivação. Você pode ajustar este valor a qualquer momento.
            </p>
          </div>
        </div>

        <div className="p-7 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};
