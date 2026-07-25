import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', 'Inter', 'system-ui', 'sans-serif'],
        display: ['ManropeVariable', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: 'rgba(255,255,255,0.72)',
        'surface-strong': 'rgba(255,255,255,0.90)',
        border: 'rgba(0,0,0,0.08)',
        'border-strong': 'rgba(0,0,0,0.14)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
        card: '0 40px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)',
        'card-hover': '0 60px 100px rgba(0,0,0,0.22), 0 12px 32px rgba(0,0,0,0.12)',
        'input-focus': '0 0 0 3px rgba(99,102,241,0.12)',
        'input-valid': '0 0 0 3px rgba(34,197,94,0.12)',
        'input-error': '0 0 0 3px rgba(239,68,68,0.10)',
      },
      backdropBlur: {
        xs: '4px',
        '4xl': '72px',
      },
      animation: {
        'orb-float': 'orb-float 20s ease-in-out infinite',
        'orb-float-reverse': 'orb-float-reverse 25s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
      keyframes: {
        'orb-float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'orb-float-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-50px, 30px) scale(0.95)' },
          '66%': { transform: 'translate(30px, -40px) scale(1.05)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
