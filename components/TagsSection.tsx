import React from 'react';
import { getLabelClass } from './add-book/utils';
import type { Profile } from '../types';

interface TagsSectionProps {
  profile: Profile | null;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
}

export const TagsSection: React.FC<TagsSectionProps> = ({
  profile,
  selectedTags,
  toggleTag
}) => {
  return (
    <div className="md:col-span-2">
      <label className={getLabelClass(false)}>Atribuir Tags</label>
      <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 rounded-[2rem] space-y-4">
        <div className="flex flex-wrap gap-2">
          {profile?.customTags?.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  isSelected 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {(profile?.customTags?.length || 0) === 0 && (
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Configure suas tags nas preferências!</p>
          )}
        </div>
      </div>
    </div>
  );
};
