/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        dark: {
          950: '#050811',
          900: '#080D1A',
          850: '#0E1626',
          800: '#151F35',
          750: '#1D2A47',
          700: '#2A3B5F',
          600: '#475569',
        },
        fintech: {
          emerald: '#10B981',
          mint: '#34D399',
          cyan: '#06B6D4',
          sky: '#38BDF8',
          rose: '#F43F5E',
          ruby: '#E11D48',
          indigo: '#6366F1',
          amber: '#F59E0B',
        }
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'fintech-card': '0 20px 45px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        'fintech-elevated': '0 30px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
      }
    },
  },
  plugins: [],
}
