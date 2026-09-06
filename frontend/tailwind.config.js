/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',
        panel: '#121820',
        'panel-2': '#161e29',
        'panel-hover': '#1c2738',
        border: '#223041',
        text: '#e7edf3',
        muted: '#8fa3b8',
        low: '#2ecc71',
        moderate: '#f1c40f',
        high: '#e67e22',
        critical: '#e74c3c',
        accent: '#3ea6ff',
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
