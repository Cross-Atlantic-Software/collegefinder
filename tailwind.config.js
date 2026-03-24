/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        brand: {
          ink: '#0b1220',
          blue: '#0ea5e9',
          yellow: '#f0c544',
        },
        action: {
          50: '#e6f6ff',
          100: '#d7efff',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        highlight: {
          100: '#fff7d1',
          200: '#ffefad',
          300: '#f0c544',
         },
        surface: {
          base: '#ffffff',
          subtle: '#f8fafc',
          elevated: '#f1f5f9',
          overlay: '#0f172acc',
        },
         slate: {
           0: '#ffffff',
           50: '#f8fafc',
           100: '#f1f5f9',
           200: '#e2e8f0',
           300: '#cbd5e1',
           400: '#94a3b8',
           500: '#64748b',
           600: '#475569',
           700: '#334155',
           800: '#1e293b',
           900: '#0f172a',
         },
        pink: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter-sans)', 'Inter', 'Arial', 'Helvetica', 'sans-serif'],
      },
      backgroundImage: {
        'light-gradient': 'linear-gradient(to right, #FBEDF7 0%, #FAF5FF 50%, #DAF1FF 100%)',
        'dark-gradient': 'linear-gradient(to right, #9705F9 0%, #B903B8 50%, #DB0078 100%)',
        'blue-gradient': 'linear-gradient(to right, #140E27 0%, #240F3C 50%, #341050 100%)',
             transitionDuration: {
               250: '250ms',
             },
             animation: {
               'fade-in': 'fadeIn 300ms ease-out',
               'slide-in-right': 'slideInRight 300ms ease-out',
               'scale-in': 'scaleIn 250ms ease-out',
             },
             keyframes: {
               fadeIn: {
                 from: { opacity: '0' },
                 to: { opacity: '1' },
               },
               slideInRight: {
                 from: { opacity: '0', transform: 'translateX(8px)' },
                 to: { opacity: '1', transform: 'translateX(0)' },
               },
               scaleIn: {
                 from: { opacity: '0', transform: 'scale(0.95)' },
                 to: { opacity: '1', transform: 'scale(1)' },
               },
             },
      },
    },
  },
  plugins: [],
};

