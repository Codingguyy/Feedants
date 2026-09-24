export const colors = {
  background: '#0F1115',
  surface: '#181B22',
  surfaceAlt: '#20242D',
  border: '#2A2F3A',
  textPrimary: '#F5F6F8',
  textSecondary: '#9AA1AE',
  textMuted: '#6B7280',
  primary: '#4C6FFF',
  primaryMuted: 'rgba(76, 111, 255, 0.15)',
  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
  neutralMuted: 'rgba(154, 161, 174, 0.15)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' },
  h2: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
};

// Central mapping of backend `phase` -> UI treatment, so every component
// that needs to color/label a phase reads from one place.
export const PHASE_META = {
  UPCOMING: { label: 'Upcoming', color: colors.textSecondary, bg: colors.neutralMuted },
  REGISTRATION_OPEN: { label: 'Registration Open', color: colors.success, bg: colors.successMuted },
  REGISTRATION_FULL: { label: 'Full', color: colors.warning, bg: colors.warningMuted },
  REGISTRATION_CLOSED: { label: 'Registration Closed', color: colors.textSecondary, bg: colors.neutralMuted },
  ONGOING: { label: 'Live Now', color: colors.primary, bg: colors.primaryMuted },
  COMPLETED: { label: 'Completed', color: colors.textMuted, bg: colors.neutralMuted },
  CANCELLED: { label: 'Cancelled', color: colors.danger, bg: colors.dangerMuted },
};
