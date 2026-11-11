/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--brand-primary, 37 99 235) / <alpha-value>)',
          dark: 'rgb(var(--brand-primary-dark, 29 78 216) / <alpha-value>)',
          light: 'rgb(var(--brand-primary-light, 239 246 255) / <alpha-value>)',
          soft: 'rgb(var(--brand-primary-soft, 219 234 254) / <alpha-value>)',
        },
        navy: {
          DEFAULT: '#0B1633',
          soft: '#16255B',
          line: '#24345F',
          muted: '#8DA2CE',
        },
        accent: {
          DEFAULT: 'rgb(var(--brand-accent, 194 65 12) / <alpha-value>)',
          dark: 'rgb(var(--brand-accent-dark, 194 65 12) / <alpha-value>)',
          light: 'rgb(var(--brand-accent-light, 255 247 237) / <alpha-value>)',
          soft: 'rgb(var(--brand-accent-soft, 255 237 213) / <alpha-value>)',
        },
        success: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        ink: '#0F172A',
        // Secondary text is deliberately darker than the classic slate-500/400
        // pairing so supporting copy passes 4.5:1 on white cards.
        muted: '#475569',
        faint: '#64748B',
        surface: '#F1F5F9',
        canvas: '#F8FAFC',
        line: '#E2E8F0',
      },
    },
    // No fontFamily overrides: text renders in the platform system font
    // (SF Pro on iOS, Roboto on Android) and font-medium/semibold/bold are
    // the stock fontWeight utilities. Do NOT add a `sans` key: NativeWind
    // overrides `font-sans` on native and it renders Times New Roman.
  },
  plugins: [],
};
