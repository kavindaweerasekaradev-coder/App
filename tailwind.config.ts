import type { Config } from 'tailwindcss'

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        line: token('line'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        'ink-3': token('ink-3'),
        primary: token('primary'),
        'primary-fg': token('primary-fg'),
        'primary-soft': token('primary-soft'),
        'primary-ink': token('primary-ink'),
        accent: token('accent'),
        'accent-fg': token('accent-fg'),
        success: token('success'),
        'success-soft': token('success-soft'),
        warning: token('warning'),
        'warning-soft': token('warning-soft'),
        danger: token('danger'),
        'danger-soft': token('danger-soft'),
        map: {
          land: token('map-land'),
          water: token('map-water'),
          park: token('map-park'),
          road: token('map-road'),
          major: token('map-major'),
        },
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Restrained scale: readable on small screens, no oversized display type.
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        small: ['0.8125rem', { lineHeight: '1.125rem' }],
        body: ['0.9375rem', { lineHeight: '1.375rem' }],
        title: ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        headline: ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        metric: ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        sm: '0.625rem',
        DEFAULT: '0.875rem',
        lg: '1.25rem',
        xl: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 20 / 0.04), 0 4px 16px -4px rgb(16 24 20 / 0.06)',
        float: '0 8px 32px -8px rgb(16 24 20 / 0.25), 0 2px 6px rgb(16 24 20 / 0.08)',
      },
      maxWidth: { app: '72rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        pulse_ring: { '0%': { transform: 'scale(.8)', opacity: '.6' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'fade-up': 'fade-up .28s ease-out both',
        'pulse-ring': 'pulse_ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
