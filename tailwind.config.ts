import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        s1: '#111111',
        s2: '#1A1A1A',
        s3: '#0E0E0E',
        gold: {
          DEFAULT: '#FAC51C',
          dim: '#C99C12',
          hover: '#FFD23D',
        },
        ink: {
          DEFAULT: '#F5F5F5',
          dim: '#9A9A9A',
          mute: '#5C5C5C',
        },
        line: {
          DEFAULT: '#222222',
          strong: '#2E2E2E',
        },
        danger: '#E04444',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '10': ['10px', '1.4'],
        '11': ['11px', '1.4'],
        '11.5': ['11.5px', '1.4'],
        '12': ['12px', '1.45'],
        '13': ['13px', '1.45'],
        '14': ['14px', '1.45'],
        '15': ['15px', '1.45'],
        '18': ['18px', '1.3'],
        '26': ['26px', '1.2'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      width: {
        sidebar: '220px',
        drawer: '460px',
      },
      spacing: {
        sidebar: '220px',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease',
        'slide-in': 'slideIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
