/** Small, shared accents. Keep content surfaces neutral and primary actions blue. */
export const colorTones = {
  blue: { surface: '#EFF6FF', border: '#BFDBFE', ink: '#1D4ED8' },
  teal: { surface: '#EFFAF7', border: '#BCE7DD', ink: '#0F766E' },
  amber: { surface: '#FFF7ED', border: '#FED7AA', ink: '#9A3412' },
  violet: { surface: '#F5F3FF', border: '#DDD6FE', ink: '#6D28D9' },
} as const;

export type ColorTone = keyof typeof colorTones;

export const featureTones = {
  prealerts: 'violet',
  shop: 'violet',
  delivery: 'teal',
  calculator: 'blue',
  rates: 'amber',
  account: 'blue',
  authorizedUsers: 'teal',
} as const satisfies Record<string, ColorTone>;

export const packageTones = {
  primary: colorTones.blue,
  success: colorTones.teal,
  accent: colorTones.amber,
} as const;
