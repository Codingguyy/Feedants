import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../styles/theme';

export default function SpotsProgressBar({ current, max, spotsRemaining, isAlmostFull }) {
  const ratio = max > 0 ? Math.min(current / max, 1) : 0;
  const barColor = isAlmostFull ? colors.warning : colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Participants</Text>
        <Text style={[styles.count, isAlmostFull && { color: colors.warning }]}>
          {current}/{max}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.helper}>
        {spotsRemaining > 0
          ? `${spotsRemaining} spot${spotsRemaining === 1 ? '' : 's'} remaining`
          : 'No spots remaining'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  title: { ...typography.caption, color: colors.textSecondary },
  count: { ...typography.caption, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  track: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill },
  helper: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
