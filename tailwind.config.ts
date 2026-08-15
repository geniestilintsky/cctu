import type { Config } from 'tailwindcss';

/**
 * Palette derived from the CCTU crest (media/): torch gold + shield blue.
 * Gold is an accent (highlights, badges, CTAs on dark) — never body text.
 * Blue is the primary action colour. Ink is the neutral ramp.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFFBEB',
          100: '#FFF3C4',
          200: '#FFE787',
          300: '#FFDA4D',
          400: '#FFCE1F',
          500: '#FFC907', // crest torch gold
          600: '#E0A800',
          700: '#B37F02',
          800: '#8A6208',
          900: '#71500C',
        },
        brand: {
          50: '#EFF7FF',
          100: '#DAEDFF',
          200: '#BEE0FF',
          300: '#91CDFF',
          400: '#5DB1FF',
          500: '#3392FB',
          600: '#1580DE', // crest shield blue
          700: '#125CB0',
          800: '#144E8F',
          900: '#164375',
          950: '#0D2947',
        },
        ink: {
          50: '#F7F8FA',
          100: '#EEF0F4',
          200: '#DDE1E9',
          300: '#C2C9D6',
          400: '#8F99AC',
          500: '#6B7688',
          600: '#525C6E',
          700: '#41495A',
          800: '#2B3242',
          900: '#171C28',
          950: '#0C0F17',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      fontSize: {
        // Display sizes carry negative tracking; the browser default is too airy
        // once a serif is set at 40px+.
        'display-sm': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-xl': ['4.5rem', { lineHeight: '0.98', letterSpacing: '-0.035em' }],
      },
      transitionTimingFunction: {
        // The built-in CSS easings are too weak to read as intentional.
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      boxShadow: {
        // Layered shadows: a tight contact shadow plus a wide ambient one.
        xs: '0 1px 2px rgba(12, 15, 23, 0.04)',
        card: '0 1px 2px rgba(12, 15, 23, 0.04), 0 1px 3px rgba(12, 15, 23, 0.03), 0 12px 28px -16px rgba(12, 15, 23, 0.14)',
        lift: '0 1px 2px rgba(12, 15, 23, 0.05), 0 4px 10px -4px rgba(12, 15, 23, 0.10), 0 24px 48px -20px rgba(12, 15, 23, 0.26)',
        float:
          '0 2px 4px rgba(12, 15, 23, 0.05), 0 12px 24px -8px rgba(12, 15, 23, 0.14), 0 40px 72px -32px rgba(12, 15, 23, 0.34)',
        // Inset highlight along the top edge — makes solid buttons read as lit.
        button:
          'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 2px rgba(12, 15, 23, 0.16)',
        'button-gold':
          'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 2px rgba(12, 15, 23, 0.14)',
      },
      backgroundImage: {
        'sheen-brand':
          'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 55%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.5' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'scroll-cue': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(5px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'fade-in': 'fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.23, 1, 0.32, 1) infinite',
        'scroll-cue': 'scroll-cue 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
