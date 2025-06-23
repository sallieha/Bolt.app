/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'glass': 'rgba(0, 0, 0, 0.2)',
        'glass-lighter': 'rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'xl': '20px',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
};