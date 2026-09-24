import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radii, spacing, typography } from '../styles/theme';

/**
 * Single source of truth for what the primary CTA says and does, driven by
 * server-computed state (`phase`, `viewer`) rather than re-deriving business
 * rules on the client.
 */
export default function RegisterButton({
  isAuthenticated,
  phase,
  viewer,
  entryFee,
  loading,
  onRegister,
  onWithdraw,
  onRequireLogin,
}) {
  if (!isAuthenticated) {
    return (
      <PrimaryButton label="Log in to Register" onPress={onRequireLogin} loading={loading} />
    );
  }

  if (viewer?.isRegistered) {
    if (viewer.canWithdraw) {
      return (
        <View>
          <SuccessPill label="You're registered" />
          <TouchableOpacity onPress={onWithdraw} disabled={loading} style={styles.withdrawLink}>
            {loading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : (
              <Text style={styles.withdrawText}>Withdraw registration</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    return <SuccessPill label="You're registered · good luck!" />;
  }

  if (viewer?.canRegister) {
    const label = entryFee > 0 ? `Register · Pay ₹${entryFee}` : 'Register Now';
    return <PrimaryButton label={label} onPress={onRegister} loading={loading} />;
  }

  return <DisabledButton label={disabledLabelForPhase(phase)} />;
}

function disabledLabelForPhase(phase) {
  switch (phase) {
    case 'UPCOMING':
      return 'Registration Opens Soon';
    case 'REGISTRATION_FULL':
      return 'Competition Full';
    case 'REGISTRATION_CLOSED':
      return 'Registration Closed';
    case 'ONGOING':
      return 'Competition In Progress';
    case 'COMPLETED':
      return 'Competition Ended';
    case 'CANCELLED':
      return 'Competition Cancelled';
    default:
      return 'Registration Unavailable';
  }
}

function PrimaryButton({ label, onPress, loading }) {
  return (
    <TouchableOpacity
      style={[styles.button, styles.primary, loading && styles.disabledOpacity]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function DisabledButton({ label }) {
  return (
    <View style={[styles.button, styles.disabled]}>
      <Text style={styles.disabledText}>{label}</Text>
    </View>
  );
}

function SuccessPill({ label }) {
  return (
    <View style={[styles.button, styles.success]}>
      <Text style={styles.successText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  primaryText: { ...typography.h2, color: '#fff' },
  disabled: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  disabledText: { ...typography.h2, color: colors.textMuted },
  disabledOpacity: { opacity: 0.7 },
  success: { backgroundColor: colors.successMuted, borderWidth: 1, borderColor: colors.success },
  successText: { ...typography.h2, color: colors.success },
  withdrawLink: { alignItems: 'center', marginTop: spacing.sm, paddingVertical: spacing.xs },
  withdrawText: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
