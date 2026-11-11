import React, { useState, useRef } from 'react';
import { identifyCoverImage, type IdentifiedCoverInfo } from '../services/geminiService';
import { CameraIcon, XMarkIcon, PlusIcon, BookOpenIcon, MagnifyingGlassIcon } from './Icons';

export interface RecognizedData {
  title: string;
  author: string;
  publisher: string;
  volumeOrIssue: string;
  isComicOrManga: boolean;
  pages?: number;
  description?: string;
  categories?: string[];
  coverUrl?: string;
}

interface CoverScanCaptureProps {
  onApplyRecognized: (data: RecognizedData) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export const CoverScanCapture: React.FC<CoverScanCaptureProps> = ({
  onApplyRecognized,
  onCancel,
  compact = false
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    identified: IdentifiedCoverInfo;
    searchResults: any[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada é muito grande (máximo 10MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setErrorMessage(null);
      setScanResult(null);
      // Inicia automaticamente o reconhecimento após a captura/seleção
      processImage(base64);
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler a imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Image: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const result = await identifyCoverImage(base64Image);
      setScanResult(result);

      if (!result.identified.title || result.identified.confidence === 'low') {
        setErrorMessage(
          'A IA não conseguiu identificar com clareza o título ou autor nesta imagem. A foto pode estar borrada, com reflexo ou com a capa cortada. Tente tirar uma foto mais nítida ou use a busca por texto manual.'
        );
      }
    } catch (err: any) {
      console.error('Erro ao escanea capa:', err);
      if (err.message === 'QUOTA_EXCEEDED') {
        setErrorMessage('Limite de uso temporariamente excedido. Por favor, aguarde alguns instantes ou use a busca manual.');
      } else if (err.message === 'HIGH_DEMAND') {
        setErrorMessage('Serviço de IA com alta demanda no momento. Tente novamente em instantes.');
      } else {
        setErrorMessage(err.message || 'Erro ao processar imagem. Verifique a conexão e tente novamente.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setScanResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmIdentified = () => {
    if (!scanResult?.identified) return;

    const idData = scanResult.identified;
    const bestMatch = scanResult.searchResults?.[0];

    onApplyRecognized({
      title: idData.title || bestMatch?.title || '',
      author: idData.author || (bestMatch?.authors ? bestMatch.authors.join(', ') : ''),
      publisher: idData.publisher || bestMatch?.publisher || '',
      volumeOrIssue: idData.volumeOrIssue || '',
      isComicOrManga: idData.isComicOrManga,
      pages: bestMatch?.pageCount || 0,
      description: bestMatch?.description || idData.description || '',
      categories: bestMatch?.categories || [],
      coverUrl: bestMatch?.coverUrl || undefined
    });
  };

  const handleSelectSearchResult = (book: any) => {
    onApplyRecognized({
      title: book.title,
      author: book.authors ? book.authors.join(', ') : '',
      publisher: book.publisher || scanResult?.identified.publisher || '',
      volumeOrIssue: scanResult?.identified.volumeOrIssue || '',
      isComicOrManga: scanResult?.identified.isComicOrManga || false,
      pages: book.pageCount || 0,
      description: book.description || '',
      categories: book.categories || [],
      coverUrl: book.coverUrl || undefined
    });
  };

  const getConfidenceBadge = (confidence: string) => {
    const c = confidence.toLowerCase();
    if (c === 'high') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Alta Precisão
        </span>
      );
    }
    if (c === 'medium') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Precisão Média
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Baixa Confiança
      </span>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 space-y-4">
      {/* Hidden file input with camera trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedImage ? (
        <div className="text-center space-y-3 py-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <CameraIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black font-serif text-slate-900 dark:text-slate-100">
              Escanear Capa com IA
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tire uma foto da capa do livro ou HQ com a câmera do celular para reconhecer o título, autor e volume automaticamente.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <CameraIcon className="w-4 h-4" />
              Tirar Foto / Enviar Capa
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CameraIcon className="w-4 h-4 text-primary" />
              Capa Capturada
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-bold underline"
            >
              Tirar Outra Foto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 aspect-[3/4] flex items-center justify-center max-w-[160px] mx-auto sm:mx-0">
              <img
                src={selectedImage}
                alt="Capa escaneada"
                className="w-full h-full object-cover"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white space-y-2">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider animate-pulse">
                    Escaneando IA...
                  </span>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 space-y-3">
              {isScanning && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-slate-600 dark:text-slate-300 text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Analisando imagem com Visão Computacional...</p>
                  <p className="text-[11px] text-slate-500">Extraindo título, autores, editora e número da edição.</p>
                </div>
              )}

              {errorMessage && !isScanning && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-2">
                  <p className="font-bold">Aviso de Reconhecimento:</p>
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-amber-700 transition-all"
                  >
                    Tentar Nova Foto
                  </button>
                </div>
              )}

              {scanResult?.identified && !isScanning && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {getConfidenceBadge(scanResult.identified.confidence)}
                      {scanResult.identified.isComicOrManga && (
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-[9px] uppercase tracking-wider">
                          HQ / Mangá / Gibi
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-50 font-serif italic">
                        {scanResult.identified.title || 'Título não identificado'}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                        {scanResult.identified.author ? `Por ${scanResult.identified.author}` : 'Autor não identificado'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {scanResult.identified.volumeOrIssue && (
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Volume/Edição:</span> {scanResult.identified.volumeOrIssue}
                        </div>
                      )}
                      {scanResult.identified.publisher && (
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Editora:</span> {scanResult.identified.publisher}
                        </div>
                      )}
                    </div>

                    {scanResult.identified.title && (
                      <button
                        type="button"
                        onClick={handleConfirmIdentified}
                        className="w-full mt-2 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Usar Dados Reconhecidos no Formulário
                      </button>
                    )}
                  </div>

                  {/* Resultados sugeridos no Google Books */}
                  {scanResult.searchResults.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ✦ Correspondências encontradas no Google Books:
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                        {scanResult.searchResults.slice(0, 3).map((book: any) => (
                          <div
                            key={book.id}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-primary/50 transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{book.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{book.authors?.join(', ')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectSearchResult(book)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all whitespace-nowrap shrink-0"
                            >
                              Aplicar Este
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
