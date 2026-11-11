import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SwatchIcon, BookOpenIcon, StarIcon, StarIconFilled, 
  CheckIcon, HeartIcon, MagnifyingGlassIcon, PlusIcon, 
  TrashIcon, PencilIcon, SparklesIcon, MoonIcon, SunIcon,
  TagIcon, BarcodeIcon, ExternalLinkIcon
} from './Icons';
import { BookStatus, BookType, STATUS_CONFIGS, STATUS_COLORS } from '../types';
import { RatingStars } from './RatingStars';

interface DesignSystemViewProps {
  onBackToApp?: () => void;
}

export const DesignSystemView: React.FC<DesignSystemViewProps> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'typography' | 'components' | 'literary' | 'playground' | 'principles'>('tokens');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Playground state
  const [sandboxButtonVariant, setSandboxButtonVariant] = useState<'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline'>('primary');
  const [sandboxButtonSize, setSandboxButtonSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [sandboxButtonLoading, setSandboxButtonLoading] = useState(false);
  const [sandboxButtonDisabled, setSandboxButtonDisabled] = useState(false);
  const [sandboxText, setSandboxText] = useState('Salvar Alterações');
  const [sandboxRating, setSandboxRating] = useState(4.5);
  const [sandboxBookStatus, setSandboxBookStatus] = useState<BookStatus>(BookStatus.Reading);
  const [sandboxBookPages, setSandboxBookPages] = useState(384);
  const [sandboxCurrentPage, setSandboxCurrentPage] = useState(210);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const colorTokens = [
    { name: 'Primary (Prussian Navy)', hex: '#274C68', tailwind: 'bg-primary / text-primary', role: 'Cor principal de identidade, cabeçalhos, destaques e ações primárias.', contrast: 'WCAG AAA (11.8:1 s/ branco)' },
    { name: 'Tertiary / Accent (Cyan)', hex: '#05A0E6', tailwind: 'bg-tertiary / text-tertiary', role: 'Cor de destaque vibrante, botões de IA, badges interativos e links.', contrast: 'WCAG AA (3.8:1 texto grande)' },
    { name: 'Secondary (Surface White)', hex: '#FFFFFF', tailwind: 'bg-white / text-white', role: 'Superfícies de cartões no modo claro, texto no modo escuro.', contrast: 'Base' },
    { name: 'Dark Background (Slate 900)', hex: '#0F172A', tailwind: 'bg-slate-900', role: 'Fundo principal da aplicação em modo escuro.', contrast: 'Canvas' },
    { name: 'Dark Surface (Slate 800)', hex: '#1E293B', tailwind: 'bg-slate-800', role: 'Cartões, gavetas e modais em modo escuro.', contrast: 'Superfície' },
    { name: 'Border Light (Slate 200)', hex: '#E2E8F0', tailwind: 'border-slate-200', role: 'Divisores e bordas estruturais suaves no modo claro.', contrast: 'Divisor' },
    { name: 'Border Dark (Slate 800)', hex: '#1E293B', tailwind: 'border-slate-800', role: 'Divisores e bordas estruturais no modo escuro.', contrast: 'Divisor' },
  ];

  const statusTokens = [
    { status: BookStatus.Reading, label: 'Lendo atualmente', color: 'blue', hex: '#2563EB', bgLight: 'bg-blue-50', textLight: 'text-blue-600', borderLight: 'border-blue-100', bgDark: 'dark:bg-blue-950/40', textDark: 'dark:text-blue-400' },
    { status: BookStatus.TBR, label: 'Não lido (Quero Ler)', color: 'amber', hex: '#D97706', bgLight: 'bg-amber-50', textLight: 'text-amber-600', borderLight: 'border-amber-100', bgDark: 'dark:bg-amber-950/40', textDark: 'dark:text-amber-400' },
    { status: BookStatus.Read, label: 'Lido (Concluído)', color: 'green', hex: '#16A34A', bgLight: 'bg-green-50', textLight: 'text-green-600', borderLight: 'border-green-100', bgDark: 'dark:bg-green-950/40', textDark: 'dark:text-green-400' },
    { status: BookStatus.Wishlist, label: 'Lista de Desejos', color: 'pink', hex: '#DB2777', bgLight: 'bg-pink-50', textLight: 'text-pink-600', borderLight: 'border-pink-100', bgDark: 'dark:bg-pink-950/40', textDark: 'dark:text-pink-400' },
    { status: BookStatus.Dropped, label: 'Abandonado', color: 'slate', hex: '#64748B', bgLight: 'bg-slate-50', textLight: 'text-slate-500', borderLight: 'border-slate-200', bgDark: 'dark:bg-slate-800/60', textDark: 'dark:text-slate-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-28 px-3 sm:px-6 animate-fade-in">
      {/* Toast de Cópia */}
      <AnimatePresence>
        {copiedToken && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold"
          >
            <CheckIcon className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Copiado: <strong>{copiedToken}</strong></span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-primary to-slate-900 text-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 border border-white/10">
              <SwatchIcon className="w-3.5 h-3.5" />
              BiblioTech Design System · v1.0
            </div>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all backdrop-blur-md active:scale-95"
              >
                Voltar à Estante
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-serif italic tracking-tight">
            Design System & UI Kit
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
            O guia definitivo de identidade visual, fundamentos tipográficos, paleta de cores e componentes modulares da plataforma literária BiblioTech. Construído com foco em estética editorial sofisticada, rigor anti-slop e acessibilidade.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipografia</p>
              <p className="text-lg font-black font-serif">Lora + Inter</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraste WCAG</p>
              <p className="text-lg font-black text-emerald-400">Nível AA / AAA</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grid Base</p>
              <p className="text-lg font-black">4px / 8px Espacial</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Semânticos</p>
              <p className="text-lg font-black text-cyan-300">5 Estados de Obra</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto custom-scrollbar">
        {[
          { id: 'tokens', label: 'Cores & Tokens', icon: <SwatchIcon className="w-4 h-4" /> },
          { id: 'typography', label: 'Tipografia', icon: <span className="font-serif font-black text-sm">Aa</span> },
          { id: 'components', label: 'Componentes UI', icon: <span className="text-xs">❖</span> },
          { id: 'literary', label: 'Padrões Literários', icon: <BookOpenIcon className="w-4 h-4" /> },
          { id: 'principles', label: 'Diretrizes & Filosofia', icon: <span className="text-xs">★</span> },
          { id: 'playground', label: 'Playground Vivo', icon: <SparklesIcon className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Cores & Tokens */}
      {activeTab === 'tokens' && (
        <section className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50">
              Paleta de Cores & Tokens da Plataforma
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Clique em qualquer amostra para copiar instantaneamente o código HEX ou classe Tailwind correspondente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {colorTokens.map((token) => (
              <div 
                key={token.name}
                onClick={() => copyToClipboard(token.hex, token.name)}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
              >
                <div 
                  className="h-24 w-full rounded-2xl mb-4 border border-black/5 shadow-inner flex items-end justify-end p-3 relative overflow-hidden"
                  style={{ backgroundColor: token.hex }}
                >
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-black/40 text-white backdrop-blur-sm group-hover:scale-105 transition-transform">
                    {token.hex}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{token.name}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{token.role}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{token.tailwind}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{token.contrast}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Status Semânticos de Leitura */}
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black font-serif italic text-slate-900 dark:text-slate-50">
              Tokens de Status Semânticos (Ciclo de Vida da Obra)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cores funcionais aplicadas estritamente em indicadores de leitura, filtros e metadados de progresso.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statusTokens.map((st) => (
                <div
                  key={st.status}
                  onClick={() => copyToClipboard(st.hex, st.label)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${st.bgLight} ${st.borderLight} ${st.bgDark}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${st.textLight} ${st.textDark}`}>
                      ● {st.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">{st.hex}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{st.status}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-2 opacity-80">
                    {st.bgLight} · {st.textLight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tab: Tipografia */}
      {activeTab === 'typography' && (
        <section className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50">
              Sistema Tipográfico Editorial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O BiblioTech utiliza uma combinação deliberada de fontes: <strong>Lora</strong> para presença literária, títulos e resenhas; e <strong>Inter</strong> para metadados densos, clareza numérica e controles de interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lora Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-cyan-400">Display & Títulos</span>
                <span className="text-xs font-mono text-slate-400">font-serif ('Lora')</span>
              </div>
              <h3 className="text-4xl font-serif font-black italic text-slate-900 dark:text-slate-50">
                A Alma dos Livros
              </h3>
              <p className="font-serif italic text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                "Capitu, apesar daqueles olhos que o diabo lhe deu... você já reparou nos olhos dela? São assim de cigana oblíqua e dissimulada."
              </p>
              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>• Pesos suportados: <strong>700 (Bold)</strong> e <strong>900 (Black)</strong></p>
                <p>• Uso: Títulos de seções, nomes de livros em destaque, citações e cabeçalhos principais.</p>
              </div>
            </div>

            {/* Inter Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">Interface & Números</span>
                <span className="text-xs font-mono text-slate-400">font-sans ('Inter')</span>
              </div>
              <h3 className="text-3xl font-sans font-black text-slate-900 dark:text-slate-50">
                Gestão 100% Precisa
              </h3>
              <p className="font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Inter fornece legibilidade superior para contadores de páginas, metas anuais, filtros por gênero e tabelas de histórico com suporte a números tabulares.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>• Pesos suportados: <strong>400 (Regular)</strong>, <strong>500 (Medium)</strong>, <strong>700 (Bold)</strong>, <strong>900 (Black)</strong></p>
                <p>• Uso: Inputs, botões, micro-copy, estatísticas e listagens.</p>
              </div>
            </div>
          </div>

          {/* Escala de Tamanhos */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-black font-serif italic text-slate-900 dark:text-slate-50">
              Escala de Tamanhos & Hierarquia Visual
            </h3>

            <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">text-4xl (36px) · font-serif font-black italic</span>
                  <p className="text-3xl sm:text-4xl font-serif font-black italic text-slate-900 dark:text-slate-50">
                    O Grande Romance Brasileiro
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">H1 Hero / Título da Estante</span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">text-2xl (24px) · font-serif font-black</span>
                  <p className="text-2xl font-serif font-black text-slate-900 dark:text-slate-50">
                    Estatísticas de Leitura Anual
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">H2 Seções Principais</span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">text-sm (14px) · font-sans font-medium text-slate-600</span>
                  <p className="text-sm font-sans font-medium text-slate-600 dark:text-slate-300 max-w-xl">
                    Texto corrido padrão para sinopses, avaliações críticas da comunidade e anotações rápidas feitas durante a leitura.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">Corpo de Texto / Sinopse</span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">text-[10px] · font-black uppercase tracking-widest</span>
                  <p className="text-[10px] font-sans font-black uppercase tracking-widest text-slate-400">
                    ✦ PREENCHIMENTO AUTOMÁTICO RÁPIDO · METADADOS
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">Micro-copy / Kickers</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Componentes UI */}
      {activeTab === 'components' && (
        <section className="space-y-10 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50">
              Biblioteca de Componentes Básicos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Componentes atômicos com estados interativos, foco visível (`focus-visible`), padding equilibrado (horizontal ≈ 2x vertical) e micro-interações táteis.
            </p>
          </div>

          {/* Botões */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-black font-serif italic text-slate-900 dark:text-slate-50">
              1. Botões & Ações Interativas
            </h3>
            
            <div className="flex flex-wrap items-center gap-4">
              <button className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95">
                Botão Primário
              </button>
              
              <button className="px-6 py-3 bg-tertiary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Ação com IA
              </button>

              <button className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                Secundário
              </button>

              <button className="px-6 py-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95">
                Perigo / Excluir
              </button>

              <button disabled className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest opacity-50 cursor-not-allowed">
                Desabilitado
              </button>
            </div>
          </div>

          {/* Inputs & Formulários */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-black font-serif italic text-slate-900 dark:text-slate-50">
              2. Campos de Formulário & Entradas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Campo de Texto Padrão
                </label>
                <input 
                  type="text" 
                  defaultValue="Dom Casmurro"
                  placeholder="Digite o título..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Campo com Busca e Ícone
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar livro por título, autor ou ISBN..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Área de Texto (Sinopses & Notas Pessoais)
                </label>
                <textarea 
                  rows={3}
                  defaultValue="Uma narrativa envolvente sobre memória, ciúme e a sociedade carioca do século XIX."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all leading-relaxed"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Padrões Literários */}
      {activeTab === 'literary' && (
        <section className="space-y-10 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50">
              Padrões de Domínio Literário
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Componentes específicos projetados para a experiência de gerenciar estantes de livros, HQs, mangás, empréstimos e desafios.
            </p>
          </div>

          {/* Exemplo de Card de Livro */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-black font-serif italic text-slate-900 dark:text-slate-50">
              1. Card de Livro na Estante (Regra Zero-Pill Aplicada)
            </h3>

            <div className="max-w-md bg-slate-50 dark:bg-slate-800/60 p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-primary dark:text-cyan-400">Ficção Científica</span>
                <span aria-hidden="true">·</span>
                <span>432 págs</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <StarIconFilled className="w-3.5 h-3.5" /> 4.8
                </span>
              </div>

              <div>
                <h4 className="text-xl font-black font-serif italic text-slate-900 dark:text-slate-50">
                  Duna (Edição Especial)
                </h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  de Frank Herbert
                </p>
              </div>

              {/* Barra de Progresso de Leitura */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Progresso (Lendo)</span>
                  <span className="text-primary dark:text-cyan-400">65% · pág. 280 de 432</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary dark:bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/60 text-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                  Lendo atualmente
                </span>
                <button className="text-[10px] font-black uppercase tracking-wider text-primary dark:text-cyan-400 hover:underline">
                  Ver Detalhes →
                </button>
              </div>
            </div>
          </div>

          {/* Sistema de Avaliação por Estrelas */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-lg font-black font-serif italic text-slate-900 dark:text-slate-50">
              2. Avaliação de Obras (Star Rating)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle interativo unificado (`RatingStars`) para notas de 0 a 5.0 estrelas, com suporte a meios-pontos (0.5), hover suave e realce em ouro nobre (`#F59E0B` / `amber-500`).
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <RatingStars
                rating={sandboxRating}
                onChange={setSandboxRating}
                size="lg"
                precision={0.5}
                showLabel={true}
              />
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                (Clique nas estrelas para testar interatividade ou meios-pontos)
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Diretrizes & Filosofia */}
      {activeTab === 'principles' && (
        <section className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50">
              Diretrizes de Design & Anti-Slop
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Princípios inegociáveis para manter o BiblioTech elegante, autêntico e livre de clichês genéricos de inteligência artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-[2rem] border border-rose-200/60 dark:border-rose-900/40 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                ✕ Anti-Patterns Proibidos (Anti-AI Slop)
              </span>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <li>• <strong>Sem pílulas estáticas em metadados:</strong> Não encapsular categorias, datas e páginas em dezenas de pílulas coloridas lado a lado.</li>
                <li>• <strong>Sem títulos com comentários de código:</strong> Jamais usar '// 01_DASHBOARD' ou '# SECTION'. Use títulos editoriais naturais.</li>
                <li>• <strong>Sem métricas falsas:</strong> Proibido criar scores arbitrários de 'Inovação 98%' ou status mecânicos de 'ONLINE // 14ms'.</li>
                <li>• <strong>Sem caixas dentro de caixas:</strong> Priorizar espaçamento e divisores finos em vez de 4 níveis de caixas com bordas sobrepostas.</li>
              </ul>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-[2rem] border border-emerald-200/60 dark:border-emerald-900/40 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                ✓ Padrões Obrigatórios (Boas Práticas)
              </span>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <li>• <strong>Metadados limpos com separadores:</strong> Usar `Gênero · 240 págs · 2026` com `text-xs text-slate-500`.</li>
                <li>• <strong>Matemática espacial correta:</strong> Padding horizontal do botão sempre ≈ 2x o padding vertical (`py-2.5 px-5`).</li>
                <li>• <strong>Contraste WCAG AA garantido:</strong> Texto principal com contraste ≥ 4.5:1 e texto grande ≥ 3:1.</li>
                <li>• <strong>Interações táteis funcionais:</strong> Todo botão possui `active:scale-95`, transições suaves e estados de loading.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Playground Vivo */}
      {activeTab === 'playground' && (
        <section className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50">
              Playground Interativo de Componentes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Experimente estados, variantes de botões, barras de progresso e tokens em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controles de Configuração */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Parâmetros do Componente
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Texto do Botão</label>
                <input 
                  type="text" 
                  value={sandboxText}
                  onChange={(e) => setSandboxText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Variante Visual</label>
                <select 
                  value={sandboxButtonVariant}
                  onChange={(e) => setSandboxButtonVariant(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="primary">Primary (#274C68)</option>
                  <option value="accent">Accent / IA (#05A0E6)</option>
                  <option value="secondary">Secondary (Slate)</option>
                  <option value="danger">Danger (Rose)</option>
                  <option value="outline">Outline</option>
                  <option value="ghost">Ghost</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Tamanho</label>
                <div className="flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSandboxButtonSize(s)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border uppercase ${sandboxButtonSize === s ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sandboxButtonLoading}
                    onChange={(e) => setSandboxButtonLoading(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Estado Loading
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sandboxButtonDisabled}
                    onChange={(e) => setSandboxButtonDisabled(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Desabilitado
                </label>
              </div>

              {/* Slider de Progresso */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Página Atual do Livro</span>
                  <span className="text-primary font-mono">{sandboxCurrentPage} / {sandboxBookPages}</span>
                </div>
                <input 
                  type="range" 
                  min={0}
                  max={sandboxBookPages}
                  value={sandboxCurrentPage}
                  onChange={(e) => setSandboxCurrentPage(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Visualização ao Vivo */}
            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-10 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-6">
                  ✦ Renderização em Tempo Real
                </span>

                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800/80 rounded-[2rem] border border-slate-200/60 dark:border-slate-700 shadow-sm space-y-6">
                  {/* Botão Renderizado */}
                  <button 
                    disabled={sandboxButtonDisabled || sandboxButtonLoading}
                    className={`rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      sandboxButtonSize === 'sm' ? 'px-4 py-2 text-[10px]' :
                      sandboxButtonSize === 'lg' ? 'px-8 py-4 text-sm' :
                      'px-6 py-3 text-xs'
                    } ${
                      sandboxButtonVariant === 'primary' ? 'bg-primary text-white shadow-md hover:bg-slate-900' :
                      sandboxButtonVariant === 'accent' ? 'bg-tertiary text-white shadow-md hover:opacity-90' :
                      sandboxButtonVariant === 'secondary' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200' :
                      sandboxButtonVariant === 'danger' ? 'bg-rose-500 text-white shadow-md hover:bg-rose-600' :
                      sandboxButtonVariant === 'outline' ? 'border-2 border-primary text-primary hover:bg-primary/5' :
                      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    } ${sandboxButtonDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {sandboxButtonLoading && (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    )}
                    {sandboxText}
                  </button>

                  {/* Card de Leitura Reativo */}
                  <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Simulação Dinâmica de Leitura</span>
                      <span className="font-bold text-primary dark:text-cyan-400">
                        {Math.round((sandboxCurrentPage / sandboxBookPages) * 100)}% concluído
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary dark:bg-cyan-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(sandboxCurrentPage / sandboxBookPages) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Snippet de Código */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto">
                <div className="flex items-center justify-between mb-2 text-slate-400 border-b border-slate-800 pb-2">
                  <span>Código Tailwind Gerado</span>
                  <button 
                    onClick={() => copyToClipboard(`<button className="px-6 py-3 bg-${sandboxButtonVariant === 'accent' ? 'tertiary' : sandboxButtonVariant} text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95">${sandboxText}</button>`, 'Snippet')}
                    className="text-[10px] text-cyan-400 hover:underline uppercase font-bold"
                  >
                    Copiar Código
                  </button>
                </div>
                <pre>{`<button className="${
                  sandboxButtonSize === 'sm' ? 'px-4 py-2 text-[10px]' :
                  sandboxButtonSize === 'lg' ? 'px-8 py-4 text-sm' :
                  'px-6 py-3 text-xs'
                } bg-${sandboxButtonVariant === 'accent' ? 'tertiary' : sandboxButtonVariant} text-white rounded-2xl font-black uppercase tracking-widest active:scale-95">
  ${sandboxText}
</button>`}</pre>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
