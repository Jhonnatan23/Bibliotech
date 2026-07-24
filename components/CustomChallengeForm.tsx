import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookType, GENRES, ChallengeType, Profile } from '../types';

interface CustomChallengeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (challenge: ChallengeType) => void;
  profile: Profile | null;
}

export const CustomChallengeForm: React.FC<CustomChallengeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profile,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customBadge, setCustomBadge] = useState('🏆');
  const [customTarget, setCustomTarget] = useState(3);
  const [customGenre, setCustomGenre] = useState('');
  const [customType, setCustomType] = useState<BookType | 'Ambos'>('Ambos');
  const [customPagesMin, setCustomPagesMin] = useState(0);
  const [customRatingMin, setCustomRatingMin] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newChallenge: ChallengeType = {
      id: `custom_chal_${Date.now()}`,
      title: customTitle,
      description: customDescription || `Desafio de leitura customizado criado por ${profile?.fullName || 'você'}.`,
      badge: customBadge,
      category: 'Personalizado',
      targetCount: customTarget,
      genreKeywords: customGenre ? [customGenre] : [],
      types: customType !== 'Ambos' ? [customType] : undefined,
      minPages: customPagesMin > 0 ? customPagesMin : undefined,
      minRating: customRatingMin > 0 ? customRatingMin : undefined,
      isCustom: true,
    };

    onSubmit(newChallenge);

    // Reset Form
    setCustomTitle('');
    setCustomDescription('');
    setCustomBadge('🏆');
    setCustomTarget(3);
    setCustomGenre('');
    setCustomType('Ambos');
    setCustomPagesMin(0);
    setCustomRatingMin(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                  👑 Novo Desafio Customizado
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Defina suas próprias regras de leitura de forma livre e flexível.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-105 dark:border-slate-700 text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* ID Title */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Título do Desafio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fantasia Épica de Inverno"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>

              {/* Subtitle description */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Breve Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Concluir as maiores trilogias de RPG e literatura fantásticas."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-85 w-full focus:outline-none focus:ring-2 focus:ring-primary font-medium dark:text-slate-200"
                />
              </div>

              {/* Badge Emoji Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ícone / Medalha</label>
                  <select
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  >
                    <option value="🏆">🏆 Troféu de Ouro</option>
                    <option value="👑">👑 Coroa de Ferro</option>
                    <option value="🕵️‍♂️">🕵️‍♂️ Detetive</option>
                    <option value="🚀">🚀 Foguete Espacial</option>
                    <option value="🪄">🪄 Varinha Mágica</option>
                    <option value="🧠">🧠 Intelectual</option>
                    <option value="🔥">🔥 Fogo/Foco</option>
                    <option value="💀">💀 Terror Extremo</option>
                    <option value="🍃">🍃 Filosofal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Target (Livros) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={customTarget}
                    onChange={(e) => setCustomTarget(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  />
                </div>
              </div>

              {/* Criteria configurations */}
              <div className="border-t border-slate-100 dark:border-slate-800/85 pt-4 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Especificar Filtros Automáticos</span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Filtrar Gênero</label>
                    <select
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="">Qualquer gênero</option>
                      {GENRES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tipo de Obra</label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value="Ambos">Livro ou HQ</option>
                      <option value={BookType.Book}>Somente Livros</option>
                      <option value={BookType.HQ}>Somente HQs</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Páginas Mínimas</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ex: 200 (0 para desativar)"
                      value={customPagesMin || ''}
                      onChange={(e) => setCustomPagesMin(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Estrelas Mínimas</label>
                    <select
                      value={customRatingMin}
                      onChange={(e) => setCustomRatingMin(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    >
                      <option value={0}>Sem filtro de estrelas</option>
                      <option value={3.0}>Mínimo 3★</option>
                      <option value={4.0}>Mínimo 4★</option>
                      <option value={4.5}>Mínimo 4.5★</option>
                      <option value={5.0}>Apenas Perfeitos (5★)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submittal buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-855 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-primary hover:bg-violet-700 rounded-2xl transition shadow-md"
                >
                  Salvar e Entrar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
