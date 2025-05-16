/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4F46E5',
          dark: '#6366F1'
        },
        secondary: {
          light: '#1E293B',
          dark: '#E2E8F0'
        },
        background: {
          light: '#F8FAFC',
          dark: '#0F172A'
        }
      }
    },
  },
  plugins: [],
};