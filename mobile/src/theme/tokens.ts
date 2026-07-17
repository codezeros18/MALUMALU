export const colors = {
  // base paper + ink (Forest / bone family, high sun contrast)
  cover: '#15492E',
  coverDeep: '#0E3320',
  paper: '#F4EFE2',
  card: '#FBF7EE',
  ink: '#1F1B14',
  inkMuted: '#5C5648',
  line: '#D8CFB8',
  lineStrong: '#B9AD8E',

  // action accent — single, locked amber
  action: '#C8761E',
  onCover: '#FBF7EE',

  // semantic — desaturated, document-appropriate
  ok: '#1F7A47',
  okBg: '#E3F0E6',
  warn: '#B5780F',
  warnBg: '#F6ECD6',
  alert: '#B23A2E',
  alertBg: '#F6DED9',
  neutral: '#6B675C',
  neutralBg: '#ECE6D8',
};

export const fonts = {
  ui: 'PlusJakartaSans_400Regular',
  uiMedium: 'PlusJakartaSans_500Medium',
  uiBold: 'PlusJakartaSans_700Bold',
  display: 'Lora_600SemiBold',
  mono: 'SpaceMono_400Regular',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 34,
  xxl: 52,
};

// documented shape rule: cards 14 / inputs 10 / interactive(pill) 999
export const radius = {
  card: 14,
  input: 10,
  pill: 999,
};

// motion language — transform/opacity only
export const motion = {
  dur: 240,
  durPress: 120,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)' as const,
  rise: 8,
  stagger: 40,
};

export const shadow = {
  card: { shadowColor: colors.cover, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  press: { shadowColor: colors.cover, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  lift: { shadowColor: colors.cover, shadowOpacity: 0.16, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } },
};
