export const colors = {
  // Primary Blue
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',

  // Error (Red)
  error: '#FF3B30',
  errorLight: '#FF6B60',
  errorDark: '#D70015',

  // Success (Green)
  success: '#34C759',
  successLight: '#30D158',
  successDark: '#248A3D',

  // Neutrals
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
    tertiary: '#C7C7CC',
  },

  // Calendar specific
  calendar: {
    selected: '#007AFF',
    today: '#B3D7FF',
    todayText: '#007AFF',
    otherMonth: '#C7C7CC',
    weekHeader: '#8E8E93',
  },
};

export const typography = {
  // Headers
  h1: {
    fontSize: 28,
    fontWeight: 700 as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: 600 as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: 600 as const,
    lineHeight: 24,
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: 400 as const,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: 500 as const,
    lineHeight: 22,
  },

  // Small
  caption: {
    fontSize: 14,
    fontWeight: 400 as const,
    lineHeight: 18,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: 500 as const,
    lineHeight: 18,
  },

  // Calendar specific
  monthTitle: {
    fontSize: 18,
    fontWeight: 600 as const,
    lineHeight: 24,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 400 as const,
    lineHeight: 22,
  },
  weekDay: {
    fontSize: 14,
    fontWeight: 500 as const,
    lineHeight: 18,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
