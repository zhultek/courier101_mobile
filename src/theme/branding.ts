export interface MobileAppearance {
  primary_color: string;
  accent_color: string;
  header_start: string;
  header_end: string;
  in_transit_color: string;
  total_shipped_color: string;
  background_style: 'soft' | 'plain';
}

export const defaultAppearance: MobileAppearance = {
  primary_color: '#2563EB', accent_color: '#F97316',
  header_start: '#132A57', header_end: '#164E63',
  in_transit_color: '#FFF7ED', total_shipped_color: '#EFFAF7', background_style: 'soft',
};

export function normalizeAppearance(value: unknown): MobileAppearance {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const color = (key: keyof MobileAppearance) => typeof raw[key] === 'string' && /^#[\da-f]{6}$/i.test(raw[key] as string)
    ? (raw[key] as string).toUpperCase() : defaultAppearance[key] as string;
  return {
    primary_color: color('primary_color'), accent_color: color('accent_color'),
    header_start: color('header_start'), header_end: color('header_end'),
    in_transit_color: color('in_transit_color'), total_shipped_color: color('total_shipped_color'),
    background_style: raw.background_style === 'plain' ? 'plain' : 'soft',
  };
}

const rgb = (hex: string) => hex.slice(1).match(/../g)!.map(value => parseInt(value, 16));
const hex = (values: number[]) => '#' + values.map(value => Math.round(value).toString(16).padStart(2, '0')).join('').toUpperCase();
export const mix = (color: string, target: string, amount: number) => hex(rgb(color).map((value, i) => value * (1 - amount) + rgb(target)[i] * amount));
export function luminance(color: string): number {
  return rgb(color).map(value => {
    const c = value / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
}
export function readable(color: string): string {
  let result = color;
  for (let i = 0; i < 30 && 1.05 / (luminance(result) + .05) < 4.5; i++) result = mix(result, '#000000', .08);
  return result;
}
export function contrast(a: string, b: string): number {
  return (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
}
function cardText(surface: string, preferred: string): string {
  return contrast(surface, preferred) >= 4.5 ? preferred
    : contrast(surface, '#000000') >= contrast(surface, '#FFFFFF') ? '#000000' : '#FFFFFF';
}
export function dashboardCardTone(surface: string) {
  const text = cardText(surface, '#0F172A');
  return {
    surface, text, muted: cardText(surface, '#475569'),
    border: mix(surface, text, .16), ink: readable(mix(surface, '#000000', .45)),
  };
}
export type DashboardCardTone = ReturnType<typeof dashboardCardTone>;
export function buildBranding(value: unknown) {
  const appearance = normalizeAppearance(value);
  const primary = readable(appearance.primary_color);
  const accent = readable(appearance.accent_color);
  return {
    appearance, primary, primaryDark: mix(primary, '#000000', .16),
    primaryLight: mix(primary, '#FFFFFF', .93), primarySoft: mix(primary, '#FFFFFF', .85),
    accent, accentLight: mix(appearance.accent_color, '#FFFFFF', .93), accentSoft: mix(appearance.accent_color, '#FFFFFF', .85),
    headerStart: readable(appearance.header_start), headerEnd: readable(appearance.header_end),
    canvas: appearance.background_style === 'plain' ? '#FFFFFF' : mix(primary, '#FFFFFF', .94),
    canvasEnd: appearance.background_style === 'plain' ? '#FFFFFF' : '#F8FAFC',
    inTransit: dashboardCardTone(appearance.in_transit_color),
    totalShipped: dashboardCardTone(appearance.total_shipped_color),
  };
}
export type Branding = ReturnType<typeof buildBranding>;
export function brandingVariables(brand: Branding): Record<string, string> {
  return Object.fromEntries(Object.entries({
    primary: brand.primary, 'primary-dark': brand.primaryDark,
    'primary-light': brand.primaryLight, 'primary-soft': brand.primarySoft,
    accent: brand.accent, 'accent-dark': mix(brand.accent, '#000000', .16),
    'accent-light': brand.accentLight, 'accent-soft': brand.accentSoft,
  }).map(([key, value]) => [`--brand-${key}`, rgb(value).join(' ')]));
}
