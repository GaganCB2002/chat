export const BRAND = {
  name: 'Kortex',
  tagline: 'Think Deeper',
  description: 'Enterprise AI platform for professionals.',
  color: '#F97373',
  gradient: 'linear-gradient(135deg, #F97373 0%, #E85C5C 100%)',
} as const;

export const COLORS = {
  primary: {
    50: '#FEF2F2',
    100: '#FFE4E0',
    200: '#FFC9BF',
    300: '#FFA692',
    400: '#FF7D6B',
    500: '#F97373',
    600: '#E85C5C',
    700: '#CC4040',
    800: '#A62E2E',
    900: '#7A1F1F',
    950: '#450E0E',
  },
  surface: {
    DEFAULT: '#ffffff',
    secondary: '#FAFAFA',
    tertiary: '#F4F4F5',
    dark: '#0F0F11',
    'dark-secondary': '#18181B',
    'dark-tertiary': '#27272A',
  },
  accent: {
    teal: '#14B8A6',
    amber: '#F59E0B',
    rose: '#F43F5E',
    emerald: '#34D399',
  },
} as const;

export { Logo, LogoMark } from './Logo';
