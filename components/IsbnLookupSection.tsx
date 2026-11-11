import React, { useState } from 'react';
import { getLabelClass } from './add-book/utils';
import { ScanBarcodeIcon, BarcodeIcon } from './Icons';
import { IsbnBarcodeScanner } from './IsbnBarcodeScanner';

interface IsbnLookupSectionProps {
  isbn: string;
  setIsbn: (val: string) => void;
  isIsbnLoading: boolean;
  handleIsbnLookup: (targetIsbn?: string) => void;
}

export const IsbnLookupSection: React.FC<IsbnLookupSectionProps> = ({
  isbn,
  setIsbn,
  isIsbnLoading,
  handleIsbnLookup
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleBarcodeDetected = (detectedIsbn: string) => {
    setIsbn(detectedIsbn);
    handleIsbnLookup(detectedIsbn);
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-1.5">
        <label className={`${getLabelClass(false)} !mb-0 flex items-center gap-2`}>
          <BarcodeIcon className="w-4 h-4 text-primary" />
          <span>Buscar por Código ISBN / Código de Barras</span>
        </label>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[8px] uppercase tracking-widest">
          Multi-base Ativa
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={isbn} 
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="Ex: 9788535914849 (10 ou 13 dígitos)"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleIsbnLookup())}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 transition-all focus:ring-4 focus:ring-primary/5" 
          />
          {isIsbnLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-0 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            title="Abrir câmera para escanear código de barras"
          >
            <ScanBarcodeIcon className="w-4 h-4" />
            <span>Escanear Cód.</span>
          </button>

          <button 
            type="button"
            onClick={() => handleIsbnLookup()}
            disabled={isIsbnLoading || !isbn.trim()}
            className="flex-1 sm:flex-none px-5 py-3 sm:py-0 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-md"
          >
            {isIsbnLoading ? 'Buscando...' : 'Carregar'}
          </button>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-tight ml-1">
        ✦ Consulta automática via bases oficiais (CBL / Brasil API, Google Books e IA inteligente).
      </p>

      {/* Barcode Camera Scanner Modal */}
      <IsbnBarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
};

