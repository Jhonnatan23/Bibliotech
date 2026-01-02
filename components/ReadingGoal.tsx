
import React from 'react';

interface ReadingGoalProps {
  current: number;
  goal: number;
  onSetGoal: (val: number) => void;
}

export const ReadingGoal: React.FC<ReadingGoalProps> = ({ current, goal, onSetGoal }) => {
  const percentage = Math.min(Math.round((current / goal) * 100), 100);
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
        onSetGoal(val);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Meta de Leitura {new Date().getFullYear()}</h3>
          <div className="flex items-baseline gap-1 mt-1">
             <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{current}</span>
             <span className="text-slate-300 dark:text-slate-700 font-bold">/</span>
             <input 
               type="number" 
               step="1"
               value={goal}
               onChange={handleGoalChange}
               className="text-lg font-bold text-primary w-12 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-primary outline-none"
             />
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">livros</span>
          </div>
        </div>
        <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded-full text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400 dark:text-slate-500">Progresso</span>
            <span className="text-primary">{percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-50 dark:border-slate-700">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${percentage}%` }}
            ></div>
        </div>
      </div>
      
      {percentage >= 100 && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl shadow-lg animate-bounce">
            Meta Batida! 🏆
          </div>
      )}
    </div>
  );
};
