import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sine: {
          green: '#14532d',
          teal: '#0f766e',
          amber: '#f59e0b',
          ink: '#17211b'
        }
      },
      boxShadow: {
        soft: '0 18px 60px rgba(23, 33, 27, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config
