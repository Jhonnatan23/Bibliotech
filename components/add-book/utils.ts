export const getLabelClass = (isRequired: boolean) => 
  `block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ml-1 flex items-center gap-1 ${
    isRequired ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
  }`;
