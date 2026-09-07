/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f8fafc',
        glass: 'rgba(255, 255, 255, 0.82)',
        'glass-panel': '#ffffff',
        'glass-hover': '#f1f5f9',
        border: '#e2e8f0',
        'border-glass': 'rgba(226, 232, 240, 0.8)',
        text: '#0f172a',
        muted: '#64748b',
        low: '#10b981',
        moderate: '#f59e0b',
        high: '#f97316',
        critical: '#ef4444',
        accent: '#0284c7',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'live-pulse': 'livePulse 1.5s infinite',
        'critical-pulse': 'pulse 1.2s infinite',
      },
      keyframes: {
        livePulse: {
          '0%, 100%': { transform: 'scale(0.9)', opacity: '0.7' },
          '50%': { transform: 'scale(1.3)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
