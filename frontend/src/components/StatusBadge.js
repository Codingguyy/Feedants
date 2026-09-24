import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PHASE_META, radii, spacing, typography } from '../styles/theme';

export default function StatusBadge({ phase }) {
  const meta = PHASE_META[phase] || PHASE_META.UPCOMING;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    ...typography.label,
    textTransform: 'uppercase',
  },
});
