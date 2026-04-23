
import React from 'react';

interface ReadingGoalProps {
  current: number;
  goal: number;
  onSetGoal: (val: number) => void;
}

export const ReadingGoal: React.FC<ReadingGoalProps> = ({ current, goal, onSetGoal }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const percentage = Math.min(Math.round((current / goal) * 100), 100);
  
  // Cálculo de Projeção
  const startOfYear = new Date(currentYear, 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const daysPassed = Math.max(1, Math.floor(diff / oneDay));
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const totalDaysInYear = isLeapYear(currentYear) ? 366 : 365;
  const daysRemaining = totalDaysInYear - daysPassed;
  
  const dailyRate = current / daysPassed;
  const projectedTotal = Math.round(current + (dailyRate * daysRemaining));
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
        onSetGoal(val);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Meta de Leitura {currentYear}</h3>
          <div className="flex items-baseline gap-1 mt-1">
             <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{current}</span>
             <span className="text-slate-300 dark:text-slate-700 font-bold">/</span>
             <input 
               type="number" 
               step="1"
               value={goal}
               onFocus={(e) => e.target.select()}
               onChange={handleGoalChange}
               className="text-lg font-bold text-primary w-12 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-primary outline-none"
             />
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">livros</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
            <div className="bg-tertiary/5 dark:bg-tertiary/10 p-3 rounded-full text-tertiary shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {current > 0 && (
                <div className="text-right animate-in fade-in slide-in-from-top-1 duration-700">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Ritmo atual p/ {currentYear}</p>
                    <p className="text-sm font-black text-primary leading-tight">
                        ~{projectedTotal} <span className="text-[9px] font-bold opacity-60 uppercase">Estimados</span>
                    </p>
                </div>
            )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400 dark:text-slate-500">Progresso Anual</span>
            <span className="text-primary">{percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-50 dark:border-slate-700">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${percentage}%` }}
            ></div>
        </div>
      </div>
      
      {percentage >= 100 ? (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl shadow-lg animate-bounce z-10">
            Meta Batida! 🏆
          </div>
      ) : (
          projectedTotal >= goal && current > 0 && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl shadow-lg z-10">
                No caminho certo ✨
            </div>
          )
      )}
    </div>
  );
};
