/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'], // we toggle .dark on <html>
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ✅ Semantic tokens (used across the app)
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surfaceAlt: 'rgb(var(--surface-alt) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',

        // ✅ Your existing brand/status colors remain available
        brand: {
          primary: '#103049',
          secondary: '#FFC857',
          accent: '#3EB489',
          background: '#F0F4F8',
          foreground: '#1F2937'
        },
        status: {
          info: '#3B82F6',
          success: '#10B981',
          warning: '#FBBF24',
          danger: '#EF4444'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'pulse-green': {
          '0%': { backgroundColor: '#dcfce7' },
          '100%': { backgroundColor: 'transparent' }
        },
        'fade-out': { '0%': { opacity: 1 }, '100%': { opacity: 0 } },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' }
        }
      },
      animation: {
        'pulse-green': 'pulse-green 1s ease-out',
        'fade-out': 'fade-out 0.7s ease-out forwards',
        shake: 'shake 0.4s ease-in-out'
      }
    }
  },
  plugins: [animate]
}
