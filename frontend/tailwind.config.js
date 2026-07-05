/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          panel: '#1f2833',
          border: '#2c3540',
        },
        cyber: {
          light: '#66fcf1',
          teal: '#45f3ff',
          purple: '#bd53ed',
          pink: '#f81f8f',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'neon-cyan': '0 0 15px rgba(102, 252, 241, 0.4)',
        'neon-purple': '0 0 15px rgba(189, 83, 237, 0.4)',
      }
    },
  },
  plugins: [],
}
