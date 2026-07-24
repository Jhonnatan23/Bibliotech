import { logger } from '../services/monitoring';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Book, Profile } from '../types';
import { BookStatus } from '../types';
import { supabase } from '../services/supabase';

// Interface for Notification settings
export interface NotificationSettings {
  readingAlarmEnabled: boolean;
  readingAlarmTime: string;
  goalsRemindersEnabled: boolean;
  annualGoal: number;
  monthlyGoal: number;
  weeklyGoal: number;
  dailyPagesEnabled: boolean;
  dailyPagesGoal: number;
  emailBookFinishedEnabled: boolean;
  readingInProgressEnabled: boolean;
  emailInactivityEnabled: boolean;
}

// In-app alert interface
export interface InAppAlert {
  id: string;
  title: string;
  description: string;
  category: 'alarm' | 'goals' | 'pages' | 'progress' | 'system';
  timestamp: string;
  isRead: boolean;
}

// Sent Email mockup interface
export interface SentEmail {
  id: string;
  subject: string;
  recipient: string;
  sentAt: string;
  contentHtml: string;
  status: 'Entregue' | 'Processando';
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  profile: Profile | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  readingAlarmEnabled: true,
  readingAlarmTime: '20:30',
  goalsRemindersEnabled: true,
  annualGoal: 12,
  monthlyGoal: 1,
  weeklyGoal: 1,
  dailyPagesEnabled: true,
  dailyPagesGoal: 20,
  emailBookFinishedEnabled: true,
  readingInProgressEnabled: true,
  emailInactivityEnabled: true,
};

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, books, profile }) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'emails' | 'settings'>('alerts');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [alerts, setAlerts] = useState<InAppAlert[]>([]);
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  
  const recipientEmail = profile?.email || '';

  // Load configuration and data from localStorage
  useEffect(() => {
    if (profile?.id) {
      const userSettingsKey = `biblio_tech_notif_config_${profile.id}`;
      const userAlertsKey = `biblio_tech_alerts_${profile.id}`;
      const userEmailsKey = `biblio_tech_emails_${profile.id}`;

      // Config
      try {
        const savedConfig = localStorage.getItem(userSettingsKey);
        if (savedConfig) {
          setSettings(JSON.parse(savedConfig));
        } else {
          // If profile goal exists, pre-seed annual goal
          setSettings(prev => ({
            ...prev,
            annualGoal: profile.readingGoal || prev.annualGoal
          }));
        }
      } catch (e) {
        logger.error("Error parsing settings", e);
      }

      // Alerts
      try {
        const savedAlerts = localStorage.getItem(userAlertsKey);
        if (savedAlerts) {
          setAlerts(JSON.parse(savedAlerts));
        } else {
          // Pre-populate with beautiful initial notifications so it looks exciting right away
          const initialAlerts: InAppAlert[] = [
            {
              id: 'initial_wel',
              title: '🎯 Sistema de Alertas Ativo!',
              description: 'Configure as suas metas de leitura e receba avisos em tempo real.',
              category: 'system',
              timestamp: new Date().toISOString(),
              isRead: false
            }
          ];
          setAlerts(initialAlerts);
          localStorage.setItem(userAlertsKey, JSON.stringify(initialAlerts));
        }
      } catch (e) {
        logger.error("Error parsing alerts", e);
      }

      // Emails
      try {
        const savedEmails = localStorage.getItem(userEmailsKey);
        if (savedEmails) {
          setEmails(JSON.parse(savedEmails));
        } else {
          const initialEmails: SentEmail[] = [
            {
              id: 'first_mail',
              subject: '📚 Bem-vindo ao Sistema de Notificações BiblioTech!',
              recipient: recipientEmail,
              sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              status: 'Entregue',
              contentHtml: generateWelcomeEmail(profile?.fullName || 'Usuário')
            }
          ];
          setEmails(initialEmails);
          localStorage.setItem(userEmailsKey, JSON.stringify(initialEmails));
        }
      } catch (e) {
        logger.error("Error parsing emails", e);
      }
    }
  }, [profile, recipientEmail]);

  // Save Settings
  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    if (profile?.id) {
      localStorage.setItem(`biblio_tech_notif_config_${profile.id}`, JSON.stringify(newSettings));
    }
  };

  // Mark alerts as read
  const markAllAsRead = () => {
    const updated = alerts.map(a => ({ ...a, isRead: true }));
    setAlerts(updated);
    if (profile?.id) {
      localStorage.setItem(`biblio_tech_alerts_${profile.id}`, JSON.stringify(updated));
    }
  };

  const deleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    if (profile?.id) {
      localStorage.setItem(`biblio_tech_alerts_${profile.id}`, JSON.stringify(updated));
    }
  };

  // Generate real alarm according to settings & current shelf
  const generateDynamicAlerts = () => {
    const newAlerts: InAppAlert[] = [];
    const newEmails: SentEmail[] = [];
    const timestamp = new Date().toISOString();

    const currentlyReadingBook = books.find(b => b.status === BookStatus.Reading);
    const readBooks = books.filter(b => b.status === BookStatus.Read);

    // 1. Reading alarm
    if (settings.readingAlarmEnabled) {
      newAlerts.push({
        id: `alarm_${Date.now()}`,
        title: `⏰ Lembrete de Horário de Leitura`,
        description: `Hora de relaxar e se perder nas páginas! Seu alarme está programado para as ${settings.readingAlarmTime} diariamente.`,
        category: 'alarm',
        timestamp,
        isRead: false
      });
    }

    // 2. Goal alerts
    if (settings.goalsRemindersEnabled) {
      const readThisYearCount = readBooks.filter(b => {
        const date = b.dateFinished || b.dateAdded;
        return new Date(date).getFullYear() === new Date().getFullYear();
      }).length;

      // Annual
      newAlerts.push({
        id: `goal_annual_${Date.now()}`,
        title: `🏆 Meta Anual (${readThisYearCount} / ${settings.annualGoal} Livros)`,
        description: `Você leu ${readThisYearCount} livros de sua meta anual de ${settings.annualGoal} para ${new Date().getFullYear()}. Mantenha o ritmo!`,
        category: 'goals',
        timestamp,
        isRead: false
      });

      // Monthly
      newAlerts.push({
        id: `goal_monthly_${Date.now()}`,
        title: `🗓️ Progresso da Meta Mensal`,
        description: `Objetivo para este mês: LER ${settings.monthlyGoal} ${settings.monthlyGoal === 1 ? 'livro' : 'livros'}. Não deixe para a última hora!`,
        category: 'goals',
        timestamp,
        isRead: false
      });
    }

    // 3. Daily pages goal
    if (settings.dailyPagesEnabled) {
      if (currentlyReadingBook) {
        newAlerts.push({
          id: `pages_daily_${Date.now()}`,
          title: `📖 Leituras Diárias: Meta de Páginas`,
          description: `Seu objetivo diário é ler ${settings.dailyPagesGoal} páginas. Abra "${currentlyReadingBook.title}" para preencher mais um fragmento hoje!`,
          category: 'pages',
          timestamp,
          isRead: false
        });
      } else {
        newAlerts.push({
          id: `pages_daily_none_${Date.now()}`,
          title: `📖 Meta Diária de ${settings.dailyPagesGoal} Páginas`,
          description: `Você não está com nenhuma leitura ativa. Comece um novo livro para calcular seu ritmo diário!`,
          category: 'pages',
          timestamp,
          isRead: false
        });
      }
    }

    // 4. Reading in progress
    if (settings.readingInProgressEnabled && currentlyReadingBook) {
      const lastStartedDate = currentlyReadingBook.dateStarted ? new Date(currentlyReadingBook.dateStarted) : null;
      const formattedDate = lastStartedDate ? lastStartedDate.toLocaleDateString('pt-BR') : 'recentemente';
      
      newAlerts.push({
        id: `in_progress_${Date.now()}`,
        title: `💡 Leitura em Andamento`,
        description: `Você iniciou "${currentlyReadingBook.title}" por ${currentlyReadingBook.author} e leu ${currentlyReadingBook.currentPage || 0} de ${currentlyReadingBook.pages} páginas (${Math.round((currentlyReadingBook.currentPage || 0) / currentlyReadingBook.pages * 100)}%). Continue lendo!`,
        category: 'progress',
        timestamp,
        isRead: false
      });
    }

    // 5. Book Finished Email (Trigger simulation & real send)
    if (settings.emailBookFinishedEnabled && readBooks.length > 0) {
      const latestOne = readBooks[0];
      const html = generateBookFinishedEmail(profile?.fullName || 'Usuário', latestOne);
      const subject = `🎉 Parabéns! Livro concluído à sua estante: ${latestOne.title}`;
      newEmails.push({
        id: `email_finished_${Date.now()}`,
        subject,
        recipient: recipientEmail,
        sentAt: timestamp,
        status: 'Entregue',
        contentHtml: html
      });

      // Disparar o e-mail real via API
      supabase.auth.getSession().then(({ data: { session } }) => {
        const token = session?.access_token;
        fetch("/api/send-email", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ to: recipientEmail, subject, html })
        })
        .then(res => res.json())
        .then(data => logger.info("[Email Service] Sucesso no disparo real:", data))
        .catch(err => logger.error("[Email Service] Erro no disparo real:", err));
      });
    }

    // 6. Inactivity Email Invitation (Trigger simulation & real send)
    if (settings.emailInactivityEnabled) {
      const tbrBooks = books.filter(b => b.status === BookStatus.TBR);
      const suggestedBook = tbrBooks[Math.floor(Math.random() * tbrBooks.length)];
      const html = generateInactivityEmail(profile?.fullName || 'Usuário', suggestedBook);
      const subject = `⏳ Sentimos sua falta na biblioteca! Que tal uma nova história?`;

      newEmails.push({
        id: `email_inactivity_${Date.now()}`,
        subject,
        recipient: recipientEmail,
        sentAt: timestamp,
        status: 'Entregue',
        contentHtml: html
      });

      // Disparar o e-mail real via API
      supabase.auth.getSession().then(({ data: { session } }) => {
        const token = session?.access_token;
        fetch("/api/send-email", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ to: recipientEmail, subject, html })
        })
        .then(res => res.json())
        .then(data => logger.info("[Email Service] Sucesso no disparo real:", data))
        .catch(err => logger.error("[Email Service] Erro no disparo real:", err));
      });
    }

    // Update state and persistent store
    const updatedAlerts = [...newAlerts, ...alerts].slice(0, 30); // Max 30
    const updatedEmails = [...newEmails, ...emails].slice(0, 15); // Max 15

    setAlerts(updatedAlerts);
    setEmails(updatedEmails);

    if (profile?.id) {
      localStorage.setItem(`biblio_tech_alerts_${profile.id}`, JSON.stringify(updatedAlerts));
      localStorage.setItem(`biblio_tech_emails_${profile.id}`, JSON.stringify(updatedEmails));
    }
  };

  const clearAllHistory = () => {
    if (profile?.id) {
      localStorage.removeItem(`biblio_tech_alerts_${profile.id}`);
      localStorage.removeItem(`biblio_tech_emails_${profile.id}`);
      setAlerts([]);
      setEmails([]);
    }
  };

  const unreadCount = useMemo(() => alerts.filter(a => !a.isRead).length, [alerts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
      >
        {/* HEADER DO PORTAL */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔔</span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Portal de Notificações
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full animate-bounce">
                  {unreadCount} Novas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Avisos personalizados pelo site e acompanhamentos simulados enviados por e-mail para <span className="font-bold text-slate-700 dark:text-slate-300">{recipientEmail}</span>.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* NAVEGAÇÃO DOS SETTINGS/STATUS */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50 gap-1">
          <button 
            onClick={() => { setActiveTab('alerts'); setSelectedEmail(null); }}
            className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'alerts' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            💬 Alertas do Site ({alerts.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('emails')}
            className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'emails' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ✉️ Caixa de E-mails ({emails.length})
          </button>

          <button 
            onClick={() => { setActiveTab('settings'); setSelectedEmail(null); }}
            className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'settings' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚙️ Configurar Preferências
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO PRINCIPAL (FLEX GROW) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900">
          
          {/* TAB 1: ALERTA DO SITE */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Histórico de Alertas</span>
                <div className="flex gap-2">
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all"
                  >
                    Marcar lidos
                  </button>
                  <button 
                    onClick={clearAllHistory}
                    className="text-[10px] px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 font-bold uppercase tracking-wider text-red-600 dark:text-red-400 transition-all"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-3xl mb-4">📭</div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Sem notificações ativas</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">Use o botão de teste nas configurações para acionar simulações inteligentes!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(a => (
                    <motion.div 
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-3xl border transition-all flex items-start gap-4 relative group ${
                        a.isRead 
                          ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400' 
                          : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/30 text-slate-800 dark:text-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="text-xl pt-0.5">
                        {a.category === 'alarm' ? '⏰' : a.category === 'goals' ? '🏆' : a.category === 'pages' ? '📖' : a.category === 'progress' ? '💡' : '🔔'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase tracking-wider">{a.title}</h4>
                          {!a.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                          )}
                        </div>
                        <p className="text-xs mt-1.5 font-medium leading-relaxed">{a.description}</p>
                        <span className="block text-[8.5px] text-slate-400 font-mono mt-2 uppercase">
                          {new Date(a.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <button 
                        onClick={() => deleteAlert(a.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all absolute top-4 right-4"
                        title="Remover alerta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAIXA DE EMAILS (Simulada para visualização rápida) */}
          {activeTab === 'emails' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[450px]">
              {/* Lista à Esquerda */}
              <div className="lg:col-span-5 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-6 space-y-3 max-h-[480px] overflow-y-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">E-mails Enviados (Modo Simulação)</span>
                
                {emails.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs">Nenhum e-mail disparado.</p>
                  </div>
                ) : (
                  emails.map(e => (
                    <div 
                      key={e.id}
                      onClick={() => setSelectedEmail(e)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 ${
                        selectedEmail?.id === e.id 
                          ? 'bg-primary/5 dark:bg-primary/10 border-primary text-primary' 
                          : 'bg-slate-50 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
                        <span>Para: {e.recipient}</span>
                        <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full text-[7.5px] font-bold">Enviado</span>
                      </p>
                      <h4 className="text-[11px] font-black tracking-tight mt-1 line-clamp-1">{e.subject}</h4>
                      <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase font-mono">
                        {new Date(e.sentAt).toLocaleDateString('pt-BR')} as {new Date(e.sentAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Corpo do E-mail à Direita */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between max-h-[480px] overflow-y-auto">
                {selectedEmail ? (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <p className="text-[9.5px] font-mono text-slate-500">De: <span className="font-bold text-slate-700 dark:text-slate-300">alerta@bibliotech.com</span></p>
                      <p className="text-[9.5px] font-mono text-slate-500">Para: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedEmail.recipient}</span></p>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{selectedEmail.subject}</h3>
                    </div>

                    <div className="flex-1 bg-white p-4.5 rounded-2xl border border-slate-250 dark:border-slate-700 text-slate-800 overflow-y-auto shadow-inner text-xs leading-relaxed max-h-[300px]">
                      {/* Inserir html simulado */}
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.contentHtml }} />
                    </div>

                    <p className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest mt-2">
                      📬 Esta é uma representação idêntica da entrega que chega à caixa do usuário.
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
                    <span className="text-4xl mb-3">📬</span>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Nenhum e-mail selecionado</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Clique em um e-mail listado à esquerda para visualizar sua campanha HTML de suporte.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURAR PREFERÊNCIAS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* ALARME DE HORÁRIO */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    ⏰ Alarme de Horário de Leitura
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Defina o horário perfeito do seu dia para parar, focar e alimentar a alma com novos capítulos.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <input 
                    type="time"
                    disabled={!settings.readingAlarmEnabled}
                    value={settings.readingAlarmTime}
                    onChange={(e) => saveSettings({ ...settings, readingAlarmTime: e.target.value })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.readingAlarmEnabled} 
                      onChange={(e) => saveSettings({ ...settings, readingAlarmEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* METAS ANUAIS, MENSAIS E SEMANAIS */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      🏆 Lembretes das Metas do Ano, Mês e Semana
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Garante alertas pontuais sobre o ritmo necessário para atingir seus alvos estabelecidos na estante.
                    </p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.goalsRemindersEnabled} 
                      onChange={(e) => saveSettings({ ...settings, goalsRemindersEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {settings.goalsRemindersEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1">Meta Anual (Livros)</label>
                      <input 
                        type="number"
                        min={1}
                        value={settings.annualGoal}
                        onChange={(e) => saveSettings({ ...settings, annualGoal: parseInt(e.target.value) || 12 })}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1">Meta Mensal (Livros)</label>
                      <input 
                        type="number"
                        min={1}
                        value={settings.monthlyGoal}
                        onChange={(e) => saveSettings({ ...settings, monthlyGoal: parseInt(e.target.value) || 1 })}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1">Sessões Semanais</label>
                      <input 
                        type="number"
                        min={1}
                        value={settings.weeklyGoal}
                        onChange={(e) => saveSettings({ ...settings, weeklyGoal: parseInt(e.target.value) || 1 })}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* METAS DE PÁGINAS DIÁRIAS */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    📖 Meta de Páginas Diárias
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Estipule quantas páginas de leitura deseja trilhar por dia para solidificar o hábito diário de leitura.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <input 
                    type="number"
                    disabled={!settings.dailyPagesEnabled}
                    min={5}
                    value={settings.dailyPagesGoal}
                    onChange={(e) => saveSettings({ ...settings, dailyPagesGoal: parseInt(e.target.value) || 20 })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold w-20 text-center"
                  />
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.dailyPagesEnabled} 
                      onChange={(e) => saveSettings({ ...settings, dailyPagesEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* ALERTAS COMPLEMENTARES POR EMAIL E PROGRESSO */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Disparos de E-mail & Leitura</span>
                
                <div className="flex justify-between items-center py-1">
                  <div>
                    <h5 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">Alertas de Livros Concluídos (Por Email)</h5>
                    <p className="text-[10.5px] text-slate-400">Envia por e-mail um resumo parabenizando e recomendando seu próximo passo literário.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.emailBookFinishedEnabled} 
                      onChange={(e) => saveSettings({ ...settings, emailBookFinishedEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/50 pt-3">
                  <div>
                    <h5 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">Alertas de Leitura em Andamento</h5>
                    <p className="text-[10.5px] text-slate-400 font-medium">Lembrar ativamente que você possui uma obra já iniciada e não finalizada.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.readingInProgressEnabled} 
                      onChange={(e) => saveSettings({ ...settings, readingInProgressEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/50 pt-3">
                  <div>
                    <h5 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">Convite por Inatividade (Por Email)</h5>
                    <p className="text-[10.5px] text-slate-400">Gera um convite encorajando o início de uma nova obra quando você estiver há tempos sem ler.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.emailInactivityEnabled} 
                      onChange={(e) => saveSettings({ ...settings, emailInactivityEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* BOTÕES DE INSTIGAÇÃO DE ALERTA SÍNCRONOS */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-6 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    🛠️ Ambiente de Teste e Disparadores
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Gere alertas dinâmicos instantaneamente com base nas suas metas e estante para validar a performance da sua entrega!
                  </p>
                </div>

                <button 
                  onClick={generateDynamicAlerts}
                  className="px-5 py-3 rounded-xl bg-primary hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-103 active:scale-97 shadow-md focus:outline-none"
                >
                  🚀 Testar Alertas & Disparos
                </button>
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// MOCK EMAIL TEMPLATE GENERATORS (HTML/CSS)
// ==========================================

function generateWelcomeEmail(name: string) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; color: #1e293b; background-color: #f8fafc; padding: 24px;">
      <div style="background-color: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <p style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #2563eb; margin: 0 0 12px 0;">BiblioTech Alertas</p>
        <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.02em;">BEM-VINDO AO SEU NOVO REINADO LITERÁRIO!</h2>
        <p style="font-size: 13px; font-weight: 500; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
          Olá, <strong>${name}</strong>!<br/><br/>
          Seu e-mail foi sincronizado com sucesso em nosso novo Sistema de Agendamentos. A partir de agora, você receberá notificações customizadas sobre o seu progresso diário, alarmes programados e alertas especiais quando finalizar uma nova obra.
        </p>
        <div style="background-color: #f1f5f9; border-radius: 16px; padding: 16px; border-left: 4px solid #2563eb; font-size: 12px; font-weight: 600; line-height: 1.5; color: #334155; margin-bottom: 24px;">
          📌 Você pode gerenciar quais tipos de lembrete deseja receber a qualquer momento diretamente na aba de Preferências de Notificações no site.
        </div>
        <a href="#" style="display: inline-block; background-color: #2563eb; border-radius: 12px; padding: 12px 24px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #ffffff; text-decoration: none; text-align: center;">Explorar Minha Estante</a>
        <div style="border-top: 1px solid #cbd5e1; margin-top: 32px; padding-top: 16px; text-align: center; font-size: 10px; color: #94a3b8;">
          BiblioTech S/A — Otimizado no Cloud Run Workspace
        </div>
      </div>
    </div>
  `;
}

function generateBookFinishedEmail(name: string, book: Book) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; color: #1e293b; background-color: #f5f3ff; padding: 24px;">
      <div style="background-color: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #ddd6fe; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <p style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #7c3aed; margin: 0 0 12px 0;">🏆 Livro Concluído!</p>
        <h2 style="font-size: 24px; font-weight: 900; color: #1e1b4b; margin: 0 0 12px 0; letter-spacing: -0.02em;">PARABÉNS PELA JORNADA! 🎉</h2>
        <p style="font-size: 13px; font-weight: 500; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
          Olá, <strong>${name}</strong>!<br/><br/>
          Você acaba de encerrar as páginas de mais uma incrível jornada. Que tremenda conquista pessoal adicionar este marco de dedicação à sua mente!
        </p>
        
        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #a21caf; margin: 0 0 8px 0;">Resumo da Obra Concluída:</p>
          <h4 style="font-size: 16px; font-weight: 950; color: #4c1d95; margin: 0 0 4px 0;">${book.title}</h4>
          <p style="font-size: 12px; color: #6b21a8; font-weight: 600; margin: 0 0 12px 0;">por ${book.author} — ${book.pages} páginas</p>
          ${book.genre ? `<span style="background-color: #f3e8ff; color: #6b21a8; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em;">${book.genre}</span>` : ''}
        </div>

        <p style="font-size: 12.5px; font-weight: 500; color: #52525b; line-height: 1.6; margin-bottom: 24px;">
          💡 Recomendação rápida de IA: Que tal abrir o seu estúdio e buscar livros similares por gênero, ou escrever suas observações e notas para consolidar seus aprendizados?
        </p>

        <a href="#" style="display: inline-block; background-color: #7c3aed; border-radius: 12px; padding: 12px 24px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #ffffff; text-decoration: none; text-align: center;">Salvar Minhas Notas</a>
      </div>
    </div>
  `;
}

function generateInactivityEmail(name: string, book?: Book) {
  const highlightSection = book ? `
    <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; margin: 20px 0;">
      <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b45309; margin: 0 0 6px 0;">Sua Próxima Leitura Indicada:</p>
      <h4 style="font-size: 15px; font-weight: 900; color: #78350f; margin: 0 0 4px 0;">${book.title}</h4>
      <p style="font-size: 11.5px; color: #92400e; font-weight: 600; margin: 0;">Escrito por ${book.author}</p>
    </div>
  ` : '';

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; color: #1e293b; background-color: #fffbeb; padding: 24px;">
      <div style="background-color: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #fef3c7; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <p style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #d97706; margin: 0 0 12px 0;">⏱️ Há quanto tempo...</p>
        <h2 style="font-size: 21px; font-weight: 900; color: #78350f; margin: 0 0 16px 0; letter-spacing: -0.02em;">O MUNDO DOS LIVROS SENTE SUA FALTA!</h2>
        <p style="font-size: 13px; font-weight: 500; color: #475569; line-height: 1.6; margin: 0;">
          Olá, <strong>${name}</strong>!<br/><br/>
          Percebemos que já faz algum tempo desde a sua última ação ou início de leitura no seu aplicativo. O hábito da leitura diária é como um músculo delicado que se fortalece na consistência.
        </p>

        ${highlightSection}

        <p style="font-size: 13px; font-weight: 500; color: #475569; line-height: 1.6; margin-bottom: 24.5px;">
          Basta deitar-se confortavelmente, ler cinco páginas hoje, e o hábito voltará de forma natural. Estamos torcendo para te ver ativo novamente!
        </p>

        <a href="#" style="display: inline-block; background-color: #d97706; border-radius: 12px; padding: 12px 24px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #ffffff; text-decoration: none; text-align: center;">Voltar ao Painel</a>
      </div>
    </div>
  `;
}
