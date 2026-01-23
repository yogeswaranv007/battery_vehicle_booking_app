/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",            // your main HTML
    "./src/**/*.{js,jsx,ts,tsx}" // all React components
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#0ea5e9',
      },
    },
  },
  plugins: [],
}
