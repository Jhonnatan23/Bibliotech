
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg', gap: 'gap-2' },
    md: { icon: 'h-8 w-8', text: 'text-xl', gap: 'gap-3' },
    lg: { icon: 'h-12 w-12', text: 'text-3xl', gap: 'gap-4' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.gap} ${className} group`}>
      <div className={`relative ${currentSize.icon} transition-all duration-700 group-hover:scale-110`}>
        {/* Advanced Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full drop-shadow-2xl"
        >
          {/* Base do Livro / Capa - Left Side */}
          <path 
            d="M10 25C10 22.2386 12.2386 20 15 20H50V80H15C12.2386 80 10 77.7614 10 75V25Z" 
            fill="url(#logo-grad-left)" 
          />
          {/* Right Side - Tech Side */}
          <path 
            d="M90 25C90 22.2386 87.7614 20 85 20H50V80H85C87.7614 80 90 77.7614 90 75V25Z" 
            fill="url(#logo-grad-right)" 
          />
          
          {/* JF Initials - Subtle Founders Signature */}
          <g opacity="0.15" className="group-hover:opacity-40 transition-opacity duration-700">
             <text 
                x="14" 
                y="76" 
                fill="white" 
                style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: 900, 
                  fontSize: '9px', 
                  letterSpacing: '-0.02em',
                  userSelect: 'none'
                }}
              >
                JF
              </text>
              {/* Decorative underline for the initials */}
              <rect x="14" y="78" width="10" height="1.5" rx="0.75" fill="white" />
          </g>
          
          {/* Analog Side Content (Left) */}
          <rect x="18" y="32" width="22" height="3" rx="1.5" fill="white" fillOpacity="0.4" />
          <rect x="18" y="42" width="22" height="3" rx="1.5" fill="white" fillOpacity="0.4" />
          <rect x="18" y="52" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.4" />
          
          {/* Digital Tech Content (Right) */}
          <circle cx="70" cy="38" r="4" stroke="white" strokeWidth="2.5" strokeOpacity="0.7" />
          <path d="M70 42V55H82" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
          <rect x="62" y="62" width="14" height="3" rx="1.5" fill="white" fillOpacity="0.7" />
          
          {/* Central Pulsating Bit */}
          <g>
            <circle cx="50" cy="50" r="4.5" fill="white" className="shadow-lg">
                <animate 
                    attributeName="r" 
                    values="4;5.5;4" 
                    dur="2.5s" 
                    repeatCount="indefinite" 
                />
                <animate 
                    attributeName="opacity" 
                    values="0.8;1;0.8" 
                    dur="2.5s" 
                    repeatCount="indefinite" 
                />
            </circle>
            {/* Core bit glow */}
            <circle cx="50" cy="50" r="8" fill="white" fillOpacity="0.15" />
          </g>

          <defs>
            <linearGradient id="logo-grad-left" x1="10" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="logo-grad-right" x1="50" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563eb" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <h1 className={`${currentSize.text} font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight`}>
          Biblio<span className="text-primary relative">
            Tech
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary/20 rounded-full group-hover:w-full transition-all"></span>
          </span>
        </h1>
      )}
    </div>
  );
};
