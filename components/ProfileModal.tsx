
import React, { useState, useRef, useEffect } from 'react';
import { 
    XMarkIcon, Cog6ToothIcon, PlusIcon, TagIcon, 
    UserIcon, KeyIcon, PhotoIcon, EnvelopeIcon,
    CameraIcon, CheckIcon
} from './Icons';
import type { Profile } from '../types';
import { supabase } from '../services/supabase';
import { storageService } from '../services/storageService';

interface ProfileModalProps {
  onClose: () => void;
  readingGoal: number;
  onSetReadingGoal: (val: number) => void;
  profile: Profile | null;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
}

type Tab = 'profile' | 'preferences' | 'security';

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  onClose, 
  readingGoal, 
  onSetReadingGoal,
  profile,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Preferences State
  const [localGoal, setLocalGoal] = useState(readingGoal);
  const [tagInput, setTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>(profile?.customTags || []);

  // Security / Email State
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailUpdateLoading, setEmailUpdateLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
        // Save preferences
        onSetReadingGoal(localGoal);
        
        // Save profile
        const updates: Partial<Profile> = {
            fullName,
            customTags
        };

        if (avatarPreview) {
            const uploadedUrl = await storageService.uploadAvatar(profile?.id || 'unknown', avatarPreview);
            if (uploadedUrl) {
                updates.avatarUrl = uploadedUrl;
                setAvatarUrl(uploadedUrl);
            }
        }

        await onUpdateProfile(updates);
        onClose();
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
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

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);

    if (!newEmail.includes('@')) {
        setEmailMessage({ text: 'Email inválido.', type: 'error' });
        return;
    }

    setEmailUpdateLoading(true);
    try {
        // Validation: Must sign in again to verify password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword
        });

        if (signInError) throw new Error("Senha atual incorreta.");

        const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
        if (updateError) throw updateError;

        setEmailMessage({ text: 'Link de confirmação enviado para os dois e-mails.', type: 'success' });
        setIsChangingEmail(false);
        setCurrentPassword('');
    } catch (error: any) {
        setEmailMessage({ text: error.message || 'Erro ao atualizar email.', type: 'error' });
    } finally {
        setEmailUpdateLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
        setPasswordMessage({ text: 'Mínimo 6 caracteres.', type: 'error' });
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
        setPasswordMessage({ text: 'Senha atualizada!', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        setPasswordMessage({ text: error.message || 'Erro ao atualizar senha.', type: 'error' });
    } finally {
        setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[95vh] md:h-auto md:max-h-[90vh] animate-in zoom-in-95 duration-500">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-72 bg-slate-50/80 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-5 md:p-10 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible custom-scrollbar">
            <div className="hidden md:block mb-10">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 overflow-hidden relative group shadow-inner">
                    {avatarPreview || avatarUrl ? (
                         <img src={avatarPreview || avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        <UserIcon className="h-10 w-10 text-primary" />
                    )}
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base truncate pr-2">{fullName || 'Meu Perfil'}</h3>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest mt-1">{email}</p>
            </div>

            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <UserIcon className="h-4 w-4" />
                Perfil
            </button>
            <button 
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'preferences' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <Cog6ToothIcon className="h-4 w-4" />
                Preferências
            </button>
            <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <KeyIcon className="h-4 w-4" />
                Segurança
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50">
                <h2 className="text-xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">
                    {activeTab === 'profile' && 'Meu Perfil'}
                    {activeTab === 'preferences' && 'Preferências'}
                    {activeTab === 'security' && 'Segurança'}
                </h2>
                <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all hover:rotate-90">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar">
                {activeTab === 'profile' && (
                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 group transition-colors hover:border-primary/50">
                            <div className="relative w-32 h-32 mb-4">
                                <div className="w-full h-full rounded-[2.5rem] bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative ring-1 ring-slate-200 dark:ring-slate-700">
                                    {avatarPreview || avatarUrl ? (
                                        <img src={avatarPreview || avatarUrl} className="w-full h-full object-cover" alt="Avatar Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <UserIcon className="h-12 w-12" />
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -right-2 -bottom-2 bg-primary text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all z-10 border-4 border-white dark:border-slate-800"
                                >
                                    <CameraIcon className="h-5 w-5" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Foto de Perfil</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Personalize sua estante</p>
                            </div>
                        </div>

                        {/* Name Section */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Nome de Exibição</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <UserIcon className="h-5 w-5" />
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Como quer ser chamado?"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-primary font-black text-slate-700 dark:text-slate-100 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                        {/* Reading Goal */}
                        <section className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Meta de Leitura Anual</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Livros desejados este ano</p>
                                </div>
                                <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                                    <span className="text-3xl font-black text-primary">{localGoal}</span>
                                </div>
                            </div>
                            <input 
                                type="range" min="1" max="100" value={localGoal}
                                onChange={(e) => setLocalGoal(parseInt(e.target.value, 10))}
                                className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                            />
                        </section>

                        {/* Tags Management */}
                        <section className="space-y-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-tertiary/10 p-2.5 rounded-xl">
                                    <TagIcon className="h-5 w-5 text-tertiary" />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Minhas Tags Personalizadas</h3>
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Ex: Favoritos, Emprestado"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-white transition-all shadow-sm"
                                />
                                <button 
                                    onClick={addTag}
                                    className="px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95 shadow-lg"
                                >
                                    <PlusIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {customTags.length > 0 ? (
                                    customTags.map(tag => (
                                        <div key={tag} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-2 flex items-center gap-3 group transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{tag}</span>
                                            <button onClick={() => removeTag(tag)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <XMarkIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center">
                                        <TagIcon className="h-8 w-8 text-slate-200 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 italic uppercase tracking-widest">Nenhuma tag criada.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                        {/* Email Update Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2.5 rounded-xl">
                                    <EnvelopeIcon className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Email da Conta</h3>
                            </div>

                            {!isChangingEmail ? (
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acesso Atual</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-100 font-mono tracking-tight">{email}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsChangingEmail(true)}
                                        className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all active:scale-95 shadow-sm"
                                    >
                                        Alterar Email
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdateEmail} className="space-y-4 p-7 bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-[2.5rem] shadow-xl animate-in zoom-in-95 duration-300">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Novo Email</label>
                                        <input 
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            required
                                            placeholder="seu@novoemail.com"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Para confirmar, digite sua senha atual</label>
                                        <input 
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            placeholder="Sua senha"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            type="button"
                                            onClick={() => { setIsChangingEmail(false); setEmailMessage(null); }}
                                            className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-500 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={emailUpdateLoading}
                                            className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/25 disabled:opacity-50"
                                        >
                                            {emailUpdateLoading ? 'Sincronizando...' : 'Confirmar Alteração'}
                                        </button>
                                    </div>
                                </form>
                            )}
                            
                            {emailMessage && (
                                <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${emailMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
                                    {emailMessage.text}
                                </div>
                            )}
                        </section>

                        {/* Password Recovery Section */}
                        <section className="space-y-6 pt-10 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-tertiary/10 p-2.5 rounded-xl">
                                    <KeyIcon className="h-5 w-5 text-tertiary" />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Alterar Senha</h3>
                            </div>
                            
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nova Senha</label>
                                        <input 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Repetir Senha</label>
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirme sua senha"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                        />
                                    </div>
                                </div>

                                {passwordMessage && (
                                    <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${passwordMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={passwordLoading || !newPassword}
                                    className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-primary shadow-xl transition-all disabled:opacity-30 active:scale-95"
                                >
                                    {passwordLoading ? 'Atualizando...' : 'Atualizar Minha Senha'}
                                </button>
                            </form>
                        </section>
                    </div>
                )}
            </div>

            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-br-[2.5rem]">
                <button onClick={onClose} className="px-6 md:px-8 py-3.5 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Sair</button>
                <button 
                  onClick={handleSaveAll} disabled={isSaving}
                  className="px-8 md:px-12 py-3.5 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
