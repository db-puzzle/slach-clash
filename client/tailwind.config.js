/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zelda-inspired palette
        'game': {
          'dark': '#1a1c2c',
          'darker': '#0f0f1a',
          'accent': '#4ecdc4',
          'accent-dark': '#2a9d8f',
          'health': '#e63946',
          'stamina': '#f4a261',
          'warning': '#ffd166',
        },
      },
      fontFamily: {
        'game': ['Rubik', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
