import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  secondary: '#10B981',
  secondaryDark: '#059669',
  background: '#F9FAFB',
  backgroundDark: '#111827',
  card: '#FFFFFF',
  cardDark: '#1F2937',
  text: '#1F2937',
  textDark: '#F9FAFB',
  textLight: '#6B7280',
  textLightDark: '#9CA3AF',
  border: '#E5E7EB',
  borderDark: '#374151',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981'
};

export const typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  h4: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  }
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const layout = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  }
});

export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  outlineText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  textButtonText: {
    color: colors.primary,
    fontSize: 16,
  }
});

export const forms = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  }
});
