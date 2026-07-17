/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'background': '#FFFFFF',
        'surface': '#FFFFFF',
        'primary': '#274C68',
        'secondary': '#FFFFFF',
        'tertiary': '#05A0E6',
        'accent': '#05A0E6',
        'text-main': '#274C68',
        'text-secondary': '#475569',
        'border-light': '#e2e8f0',
      },
      fontFamily: {
        'serif': ['Lora', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.03)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      },
      animation: {
        shake: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
      }
    },
  },
  plugins: [],
}
