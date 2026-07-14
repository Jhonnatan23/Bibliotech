
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Book, Story, Profile } from '../types';
import { dbService } from '../services/database';
import { SparklesIcon, PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, XMarkIcon, CheckIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './ConfirmationModal';

interface CreativeStudioProps {
  books: Book[];
  profile: Profile | null;
}

export const CreativeStudio: React.FC<CreativeStudioProps> = ({ books, profile }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showInfluenceModal, setShowInfluenceModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (!activeStory?.content) return [''];
    return activeStory.content.split('<!--PAGE_BREAK-->');
  }, [activeStory?.content]);

  const updatePageContent = (newContent: string) => {
    if (!activeStory) return;
    const newPages = [...pages];
    newPages[currentPage] = newContent;
    setActiveStory({
      ...activeStory,
      content: newPages.join('<!--PAGE_BREAK-->')
    });
  };

  const addNewPage = () => {
    if (!activeStory) return;
    const newPages = [...pages, ''];
    setActiveStory({
      ...activeStory,
      content: newPages.join('<!--PAGE_BREAK-->')
    });
    setCurrentPage(newPages.length - 1);
  };

  const removePage = (index: number) => {
    if (!activeStory || pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setActiveStory({
      ...activeStory,
      content: newPages.join('<!--PAGE_BREAK-->')
    });
    setCurrentPage(Math.max(0, index - 1));
  };

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    const data = await dbService.getAllStories();
    setStories(data);
    setIsLoading(false);
  };

  const handleCreateStory = async () => {
    const newStory = {
      title: 'Nova História',
      content: '',
      influences: { books: [], authors: [] }
    };
    const saved = await dbService.saveStory(newStory);
    setStories([saved, ...stories]);
    setActiveStory(saved);
    setIsEditing(true);
  };

  const handleSaveActiveStory = async () => {
    if (!activeStory) return;
    const saved = await dbService.saveStory(activeStory);
    setStories(stories.map(s => s.id === saved.id ? saved : s));
    setActiveStory(saved);
  };

  const handleDeleteStory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStoryToDelete(id);
  };

  const handleConfirmDeleteStory = async () => {
    if (!storyToDelete) return;
    const id = storyToDelete;
    setStoryToDelete(null);
    await dbService.deleteStory(id);
    setStories(stories.filter(s => s.id !== id));
    if (activeStory?.id === id) {
      setActiveStory(null);
      setIsEditing(false);
    }
  };

  const getAssistantTip = async (mode: 'general' | 'revision' | 'evaluation') => {
    if (!activeStory) return;
    
    setIsAiLoading(true);
    setAiResponse(null);

    const influenceContext = activeStory.influences.books.length > 0 || activeStory.influences.authors.length > 0
      ? `O usuário se inspira em: ${[...activeStory.influences.books, ...activeStory.influences.authors].join(', ')}.`
      : '';

    let prompt = '';
    let systemInstruction = `Você é um Assistente de Escrita criativa e mentor literário. 
Regra de Ouro: VOCÊ NÃO DEVE ESCREVER A HISTÓRIA PELO USUÁRIO. Sua função é dar dicas, conselhos, orientações e revisar a semântica. 
Seja encorajador e técnico. 
${influenceContext}`;

    if (mode === 'general') {
      prompt = `Baseado no que escrevi abaixo, me dê dicas de como continuar ou como melhorar a narrativa. 
História: "${activeStory.title}"
Conteúdo atual: "${activeStory.content}"`;
    } else if (mode === 'revision') {
      prompt = `Por favor, faça uma revisão semântica e gramatical do trecho abaixo. Aponte o que pode ser melhorado sem reescrever o texto inteiro para mim, apenas dê as sugestões.
Conteúdo: "${activeStory.content}"`;
    } else if (mode === 'evaluation') {
      prompt = `Faça uma avaliação geral da minha história com base nas minhas influências literárias. O texto está coerente? O tom combina com o que eu busco?
História: "${activeStory.title}"
Conteúdo: "${activeStory.content}"`;
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          model: 'gemini-1.5-flash'
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("wait while your application starts")) {
          throw new Error('O servidor está inicializando. Por favor, aguarde alguns segundos e tente novamente.');
        }
        throw new Error('Servidor indisponível ou resposta inválida. Tente novamente em instantes.');
      }

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 503 || errData.isHighDemand || errData.error?.includes('high demand')) {
          throw new Error('ALTA_DEMANDA');
        }
        throw new Error(errData.error || 'Falha na comunicação com a IA');
      }

      const data = await response.json();
      const text = data.text;
      setAiResponse(text || 'Não consegui gerar uma resposta no momento.');
    } catch (error: any) {
      if (error.message === 'ALTA_DEMANDA') {
        setAiResponse('O Mentor está muito requisitado no momento! Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        console.error('AI Error:', error);
        setAiResponse(`Erro: ${error.message || 'Ocorreu um erro ao consultar o assistente.'}`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const availableAuthors = useMemo(() => {
    const authors = new Set(books.map(b => b.author));
    return Array.from(authors).sort();
  }, [books]);

  const toggleInfluence = (type: 'books' | 'authors', value: string) => {
    if (!activeStory) return;
    const current = [...activeStory.influences[type]];
    const index = current.indexOf(value);
    
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(value);
    }

    setActiveStory({
      ...activeStory,
      influences: {
        ...activeStory.influences,
        [type]: current
      }
    });
  };

  if (activeStory && isEditing) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)] animate-in fade-in duration-500">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
               <button 
                onClick={() => { setIsEditing(false); setActiveStory(null); loadStories(); }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
               >
                 <XMarkIcon className="h-6 w-6" />
               </button>
               <input 
                value={activeStory.title}
                onChange={(e) => setActiveStory({...activeStory, title: e.target.value})}
                className="flex-1 text-2xl font-black bg-transparent border-none focus:ring-0 placeholder:text-slate-300"
                placeholder="Título da sua história..."
               />
               <button 
                onClick={handleSaveActiveStory}
                className="btn-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
               >
                 Salvar
               </button>
            </div>

            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setShowInfluenceModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                >
                    <BookOpenIcon className="h-4 w-4" />
                    Influências ({activeStory.influences.books.length + activeStory.influences.authors.length})
                </button>
                {activeStory.influences.authors.map(a => (
                    <span key={a} className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold border border-primary/10">{a}</span>
                ))}
            </div>

            <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <button 
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 transition-all hover:bg-primary/10 hover:text-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Página <span className="text-primary">{currentPage + 1}</span> de {pages.length}
                        </span>
                        <button 
                            disabled={currentPage === pages.length - 1}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 transition-all hover:bg-primary/10 hover:text-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {pages.length > 1 && (
                            <button 
                                onClick={() => removePage(currentPage)}
                                className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="Remover página atual"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        )}
                        <button 
                            onClick={addNewPage}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Nova Página
                        </button>
                    </div>
                </div>

                <div className="relative flex-1 group">
                    <div className="absolute -inset-1 bg-gradient-to-b from-primary/5 to-transparent rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    <textarea 
                        value={pages[currentPage]}
                        onChange={(e) => updatePageContent(e.target.value)}
                        className="w-full h-full min-h-[500px] bg-white dark:bg-slate-800/50 p-10 md:p-14 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 focus:border-primary/30 focus:ring-0 transition-all resize-none font-serif text-lg leading-[1.8] placeholder:text-slate-300 shadow-inner"
                        placeholder="Comece a escrever esta página..."
                    />
                    <div className="absolute bottom-6 right-10 pointer-events-none opacity-20">
                        <BookOpenIcon className="h-8 w-8 text-primary" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 sticky top-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/40">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">Mentor IA</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Seu assistente criativo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => getAssistantTip('general')}
                disabled={isAiLoading || !activeStory.content}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
                    <PencilIcon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Dicas de Escrita</span>
              </button>
              <button 
                onClick={() => getAssistantTip('revision')}
                disabled={isAiLoading || !activeStory.content}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                    <CheckIcon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Revisão Semântica</span>
              </button>
              <button 
                onClick={() => getAssistantTip('evaluation')}
                disabled={isAiLoading || !activeStory.content}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                    <SparklesIcon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Avaliar narrativa</span>
              </button>
            </div>

            <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto bg-black/30 rounded-3xl p-6 border border-white/5 custom-scrollbar">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
                   <div className="w-8 h-8 border-3 border-white/10 border-t-primary rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">O Mentor está analisando...</p>
                </div>
              ) : aiResponse ? (
                <div className="prose prose-invert prose-sm">
                   <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <SparklesIcon className="h-10 w-10 text-white/10 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-loose">
                    Selecione uma ação acima para receber ajuda do Mentor baseado no que você escreveu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Influence Modal */}
        <AnimatePresence>
            {showInfluenceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowInfluenceModal(false)}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-widest">Suas Influências</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">O Mentor usará estes modelos para te guiar</p>
                            </div>
                            <button onClick={() => setShowInfluenceModal(false)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Autores da sua Estante</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableAuthors.map(author => (
                                        <button 
                                            key={author}
                                            onClick={() => toggleInfluence('authors', author)}
                                            className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-left transition-all border ${
                                                activeStory.influences.authors.includes(author)
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-primary/30'
                                            }`}
                                        >
                                            {author}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Livros da sua Estante</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {books.filter(b => b.status === 'Lido').map(book => (
                                        <button 
                                            key={book.id}
                                            onClick={() => toggleInfluence('books', book.title)}
                                            className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                                                activeStory.influences.books.includes(book.title)
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-primary/30'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">{book.title}</p>
                                                <p className="text-[9px] font-bold opacity-60 mt-0.5">{book.author}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 text-center">
                            <button 
                                onClick={() => setShowInfluenceModal(false)}
                                className="btn-primary px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                            >
                                Confirmar Seleção
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Estúdio Criativo</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1 italic">Escreva sua própria jornada literária</p>
        </div>
        <button 
          onClick={handleCreateStory}
          className="btn-primary flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-[12px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          <PencilIcon className="h-5 w-5" />
          Começar Nova História
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
             <div key={i} className="h-48 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))
        ) : stories.length > 0 ? (
          stories.map((story) => (
            <div 
              key={story.id} 
              onClick={() => { setActiveStory(story); setIsEditing(true); }}
              className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="flex flex-col h-full gap-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <PencilIcon className="h-5 w-5" />
                  </div>
                  <button 
                    onClick={(e) => handleDeleteStory(story.id, e)}
                    className="p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2 line-clamp-1">{story.title}</h3>
                  <p className="text-slate-400 text-xs font-medium line-clamp-2 leading-relaxed">
                    {story.content || 'Nenhum conteúdo ainda...'}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Atualizado em {new Date(story.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Mentor Ativo</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
               <PencilIcon className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Sua jornada começa aqui</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-10 leading-loose">
              Crie sua primeira história e use seu acervo literário como inspiração para o Mentor te guiar.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={!!storyToDelete}
        onClose={() => setStoryToDelete(null)}
        onConfirm={handleConfirmDeleteStory}
        title="Excluir História"
        message="Tem certeza que deseja excluir esta história? Esta ação é permanente e não poderá ser desfeita."
      />
    </div>
  );
};
