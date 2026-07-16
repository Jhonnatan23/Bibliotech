import React, { useState, useEffect, useMemo } from 'react';
import type { Book, Profile, Loan } from '../types';
import { BookStatus } from '../types';
import { dbService } from '../services/database';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Mail, 
  User, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Loader2, 
  Inbox,
  Sparkles
} from 'lucide-react';

interface LoansViewProps {
  books: Book[];
  profile: Profile | null;
  onUpdateBook: (book: Book) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({ 
  books, 
  profile,
  onUpdateBook 
}) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Default to 14 days in the future
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch loans from database
  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const data = await dbService.getAllLoans();
      setLoans(data);
    } catch (err) {
      console.error('Erro ao carregar empréstimos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [books]);

  // Books available for loan (not currently loaned, and not on wishlist)
  const availableBooks = useMemo(() => {
    return books.filter(b => !b.isLoaned && b.status !== BookStatus.Wishlist);
  }, [books]);

  // Active loans
  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'active' || !l.return_date);
  }, [loans]);

  // Returned loans
  const returnedLoans = useMemo(() => {
    return loans.filter(l => l.status === 'returned' || l.return_date);
  }, [loans]);

  // Handle loan registration
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedBookId) {
      setErrorMsg('Por favor, selecione um livro ou HQ disponível.');
      return;
    }
    if (!borrowerName.trim()) {
      setErrorMsg('Por favor, insira o nome de quem está pegando emprestado.');
      return;
    }
    if (!dueDate) {
      setErrorMsg('Por favor, defina uma data de devolução esperada.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await dbService.createLoan(
        selectedBookId,
        borrowerName.trim(),
        borrowerEmail.trim() || undefined,
        new Date(dueDate).toISOString()
      );

      if (result.success) {
        // Find the book and update its status locally to sync state immediately
        const loanedBook = books.find(b => b.id === selectedBookId);
        if (loanedBook) {
          onUpdateBook({
            ...loanedBook,
            isLoaned: true,
            borrowerName: borrowerName.trim(),
            loanDate: new Date().toISOString().split('T')[0]
          });
        }

        // Close modal and reset fields
        setIsModalOpen(false);
        setSelectedBookId('');
        setBorrowerName('');
        setBorrowerEmail('');
        
        const nextTwoWeeks = new Date();
        nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
        setDueDate(nextTwoWeeks.toISOString().split('T')[0]);

        // Refresh list
        await fetchLoans();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao registrar empréstimo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle marking a loan as returned
  const handleReturnLoan = async (loanId: string, bookId: string) => {
    if (!window.confirm('Confirmar a devolução deste livro/HQ?')) return;

    try {
      // Optmistic state updates to feel snappy
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, return_date: new Date().toISOString(), status: 'returned' } : l));

      const result = await dbService.returnLoan(loanId);
      if (result.success) {
        // Sync parent book state
        const originalBook = books.find(b => b.id === bookId);
        if (originalBook) {
          onUpdateBook({
            ...originalBook,
            isLoaned: false,
            borrowerName: undefined,
            loanDate: undefined
          });
        }
        await fetchLoans();
      }
    } catch (err) {
      console.error('Erro ao devolver obra:', err);
      alert('Não foi possível registrar a devolução no momento.');
      fetchLoans(); // Rollback to actual db state on error
    }
  };

  // Calculate stats
  const overdueCount = useMemo(() => {
    return activeLoans.filter(l => new Date(l.due_date) < new Date()).length;
  }, [activeLoans]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 space-y-6 md:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Biblioteca Segura</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Controle de Empréstimos</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Acompanhe seus livros emprestados para amigos e envie notificações automáticas por e-mail.</p>
        </div>
        
        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-tertiary text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/20 transition-all hover:scale-102 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Novo Empréstimo
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Fora</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-1">{activeLoans.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Em Atraso</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-1">{overdueCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Devolvidos</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-1">{returnedLoans.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: List and Empty States */}
      <div className="space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
          <span>📚</span> Empréstimos Ativos
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-slate-400">Carregando controle de empréstimos...</p>
          </div>
        ) : activeLoans.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4 text-slate-300 dark:text-slate-600">
              <Inbox className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Nenhuma obra fora!</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">Sua estante está completa e organizada no momento. Todos os seus livros estão guardados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {activeLoans.map(loan => {
                const book = books.find(b => b.id === loan.book_id);
                const isOverdue = new Date(loan.due_date) < new Date();
                
                // Days remaining calculation
                const diffTime = new Date(loan.due_date).getTime() - new Date().getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <motion.div
                    key={loan.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between gap-4 relative overflow-hidden group hover:shadow-lg transition-all"
                  >
                    {/* Decorative state marker bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isOverdue ? 'bg-red-500' : 'bg-primary'}`} />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          isOverdue 
                            ? 'bg-red-50 dark:bg-red-950/10 text-red-600 border-red-100 dark:border-red-900/30' 
                            : 'bg-indigo-50 dark:bg-indigo-950/10 text-primary border-indigo-100 dark:border-indigo-900/30'
                        }`}>
                          {isOverdue ? '⚠️ Atrasado' : '⏳ Em dia'}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400">
                          {daysLeft < 0 
                            ? `Atrasado por ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'dia' : 'dias'}` 
                            : daysLeft === 0 
                            ? 'Devolve hoje!' 
                            : `${daysLeft} dias restantes`}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-900 dark:text-slate-50 font-serif leading-tight">
                          {book ? book.title : 'Obra Desconhecida'}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                          {book ? `por ${book.author}` : 'Autor Desconhecido'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold">Para:</span>
                          <span className="font-black text-slate-900 dark:text-white">{loan.borrower_name}</span>
                        </div>
                        {loan.borrower_email && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{loan.borrower_email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Devolução limite:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {new Date(loan.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleReturnLoan(loan.id, loan.book_id)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:bg-slate-800/50 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 dark:hover:border-emerald-900/30 text-slate-600 dark:text-slate-300 border border-slate-150 dark:border-slate-700/60 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4" /> Marcar como Devolvido
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* History section for returned items */}
      {returnedLoans.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Histórico de Devoluções ({returnedLoans.length})
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {returnedLoans.slice(0, 5).map(loan => {
                const book = books.find(b => b.id === loan.book_id);
                return (
                  <div key={loan.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 dark:text-slate-100 text-sm font-serif">
                        {book ? book.title : 'Obra Desconhecida'}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        Emprestado para: <span className="text-slate-700 dark:text-slate-300">{loan.borrower_name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                        📅 {new Date(loan.loan_date).toLocaleDateString('pt-BR')} até {new Date(loan.due_date).toLocaleDateString('pt-BR')}
                      </span>

                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 px-2.5 py-1 rounded-md border border-emerald-100/50 dark:border-emerald-900/20">
                        <CheckCircle className="h-3.5 w-3.5" /> Devolvido em {loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Register Loan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-primary" />
                    Registrar Novo Empréstimo
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Compartilhe cultura, acompanhe o retorno
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateLoan} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Choose Book */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Qual obra quer emprestar?</label>
                  {availableBooks.length === 0 ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-150 dark:border-slate-700/60 text-xs font-bold text-slate-400 text-center">
                      Sem obras disponíveis na estante para emprestar.
                    </div>
                  ) : (
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold appearance-none outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Selecione um Livro ou HQ...</option>
                      {availableBooks.map(b => (
                        <option key={b.id} value={b.id}>
                          📖 {b.title} (por {b.author})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Borrower Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Nome do Amigo</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-primary transition-colors"
                      required
                    />
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Borrower Email */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">E-mail do Amigo (Opcional)</label>
                    <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/30 text-primary border border-indigo-100 dark:border-indigo-900/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Dispara Aviso</span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Ex: joao@email.com"
                      value={borrowerEmail}
                      onChange={(e) => setBorrowerEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-primary transition-colors"
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal pl-1">
                    Se inserido, João receberá um lembrete com os detalhes da obra e o prazo limite de devolução.
                  </p>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Data Limite de Devolução</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-primary transition-colors"
                      required
                    />
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || availableBooks.length === 0}
                    className="flex-1 bg-primary hover:bg-tertiary disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/20 transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" /> Registrando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5" /> Registrar Empréstimo
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
