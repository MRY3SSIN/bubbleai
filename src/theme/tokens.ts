export const colors = {
  background: '#F7FBF8',
  backgroundAlt: '#EEF7F4',
  card: '#EAF6F5',
  cardStrong: '#DFF1EE',
  ink: '#10201E',
  inkMuted: '#627571',
  mint: '#12A28B',
  mintSoft: '#BFEDE5',
  mintDeep: '#0C5147',
  accent: '#44B4A1',
  border: '#D5E8E2',
  white: '#FFFFFF',
  danger: '#FF5D5D',
  dangerSoft: '#FFE8E8',
  warning: '#F4B942',
  shadow: 'rgba(15, 38, 33, 0.08)',
  overlay: 'rgba(16, 32, 30, 0.08)',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radii = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
};

export const typography = {
  display: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 42,
    lineHeight: 46,
  },
  h1: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 34,
    lineHeight: 38,
  },
  h2: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 28,
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
};

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  motion,
};

export type Theme = typeof theme;

