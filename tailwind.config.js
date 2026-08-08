/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        dark: {
          950: '#070A11',
          900: '#0B0F19',
          850: '#111827',
          800: '#1B2436',
          750: '#243047',
          700: '#334155',
        }
      }
    },
  },
  plugins: [],
}
