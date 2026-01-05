
import React, { useState } from 'react';
import { Book } from '../types';
import { XMarkIcon } from './Icons';

interface PricePaidModalProps {
  book: Book;
  onClose: () => void;
  onConfirm: (price: number) => void;
}

export const PricePaidModal: React.FC<PricePaidModalProps> = ({ book, onClose, onConfirm }) => {
  const [price, setPrice] = useState<string>(book.estimatedPrice?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseFloat(price.replace(',', '.')) || 0;
    onConfirm(finalPrice);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">Desejo Realizado!</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">✦ Movendo para sua estante</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <XMarkIcon className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quanto você pagou por:</p>
                <h3 className="text-lg font-black text-primary font-serif italic mb-6">"{book.title}"</h3>
            </div>

            <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 group-focus-within:text-primary transition-colors">R$</span>
                <input 
                    type="text"
                    autoFocus
                    placeholder="0,00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 pl-14 pr-6 text-2xl font-black text-slate-900 dark:text-white outline-none focus:border-primary transition-all text-right"
                />
            </div>

            {book.estimatedPrice && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Valor que você estimou:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">R$ {book.estimatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all active:scale-95"
                >
                    Confirmar Aquisição
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
