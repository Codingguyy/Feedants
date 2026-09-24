import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../styles/theme';

/**
 * Renders a live dd:hh:mm:ss countdown to `targetDate`.
 *
 * `serverTime` / `fetchedAt` are used to compute a clock-offset so the
 * countdown is accurate even if the device's local clock is wrong - we
 * anchor to (serverTime at fetch) + (elapsed local time since fetch)
 * rather than trusting Date.now() alone.
 */
export default function CountdownTimer({ targetDate, serverTime, fetchedAt, label, onComplete }) {
  const offsetMs = useMemo(() => {
    if (!serverTime || !fetchedAt) return 0;
    return new Date(serverTime).getTime() - fetchedAt;
  }, [serverTime, fetchedAt]);

  const [now, setNow] = useState(() => Date.now() + offsetMs);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offsetMs), 1000);
    return () => clearInterval(id);
  }, [offsetMs]);

  const diff = targetDate ? new Date(targetDate).getTime() - now : null;
  const isComplete = diff === null || diff <= 0;

  useEffect(() => {
    if (isComplete && onComplete) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  if (!targetDate || isComplete) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const segments = [
    { value: days, unit: 'd' },
    { value: hours, unit: 'h' },
    { value: minutes, unit: 'm' },
    { value: seconds, unit: 's' },
  ].filter((seg, idx) => idx === 3 || seg.value > 0 || idx >= segments_visible_from(days, hours, minutes));

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {segments.map((seg) => (
          <View key={seg.unit} style={styles.segment}>
            <Text style={styles.value}>{String(seg.value).padStart(2, '0')}</Text>
            <Text style={styles.unit}>{seg.unit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Decide the first unit worth showing so we don't render "00d 00h" for a
// countdown that's only a few minutes away.
function segments_visible_from(days, hours, minutes) {
  if (days > 0) return 0;
  if (hours > 0) return 1;
  if (minutes > 0) return 2;
  return 3;
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.sm },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  row: { flexDirection: 'row' },
  segment: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    alignItems: 'center',
    minWidth: 44,
  },
  value: { ...typography.h2, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  unit: { ...typography.label, color: colors.textMuted, marginTop: 2 },
});
