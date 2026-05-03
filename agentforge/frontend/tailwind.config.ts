import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0b0f',
          1: '#0f1117',
          2: '#14161e',
          3: '#1a1d27',
          4: '#20232f',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          strong:  'rgba(255,255,255,0.12)',
        },
        brand: {
          DEFAULT: '#7c5cfc',
          dim:     'rgba(124,92,252,0.15)',
          border:  'rgba(124,92,252,0.35)',
        },
        text: {
          primary:   '#d4d8e1',
          secondary: '#8b929e',
          muted:     '#5a6070',
        },
        green:  '#22c55e',
        red:    '#f43f5e',
        yellow: '#eab308',
        blue:   '#38bdf8',
        orange: '#f97316',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
