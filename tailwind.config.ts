import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          950: '#0a2820',
          900: '#0f3a2e',
          800: '#15493b',
          700: '#1d6450',
          600: '#2a8068',
        },
        gold: {
          50: '#fbf7ec',
          100: '#f6ecd0',
          200: '#ecd99c',
          300: '#e0c167',
          400: '#d4a957',
          500: '#c08e3a',
          600: '#a07229',
          700: '#7e5821',
        },
        ivory: {
          50: '#fbf8f1',
          100: '#f5efe6',
          200: '#ebe1cf',
          300: '#dcceb0',
        },
        ink: {
          900: '#0a1410',
          800: '#101c17',
        },
        dawn: {
          start: '#1a1438',
          mid: '#3d2a5c',
          end: '#a86a8e',
        },
        sunset: {
          start: '#ff8b5a',
          mid: '#c94f6d',
          end: '#3d1f4a',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-amiri)', 'serif'],
      },
      backgroundImage: {
        'arabesque': "url('/patterns/arabesque.svg')",
        'radial-gold': 'radial-gradient(circle at 50% 50%, rgba(212,169,87,0.15) 0%, transparent 60%)',
        'fajr': 'linear-gradient(180deg, #1a1438 0%, #3d2a5c 50%, #a86a8e 100%)',
        'maghrib': 'linear-gradient(180deg, #ff8b5a 0%, #c94f6d 50%, #3d1f4a 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
