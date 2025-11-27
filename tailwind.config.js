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
        pink: '#DB0078',
      },
      fontFamily: {
        sans: ['var(--font-manrope-sans)', 'Manrope', 'Arial', 'Helvetica', 'sans-serif'],
      },
      backgroundImage: {
        'light-gradient': 'linear-gradient(to right, #FBEDF7 0%, #FAF5FF 50%, #DAF1FF 100%)',
        'dark-gradient': 'linear-gradient(to right, #9705F9 0%, #B903B8 50%, #DB0078 100%)',
        'blue-gradient': 'linear-gradient(to right, #140E27 0%, #240F3C 50%, #341050 100%)',
      },
    },
  },
  plugins: [],
};

