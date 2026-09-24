import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import SpotsProgressBar from '../components/SpotsProgressBar';
import InfoCard from '../components/InfoCard';
import RegisterButton from '../components/RegisterButton';
import { useCompetitionDetails } from '../hooks/useCompetitionDetails';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, typography, radii } from '../styles/theme';

export default function CompetitionDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { competitionId } = route.params;
  const { isAuthenticated } = useAuth();

  const {
    data,
    fetchedAt,
    loading,
    refreshing,
    error,
    actionLoading,
    actionError,
    onRefresh,
    reload,
    register,
    withdraw,
  } = useCompetitionDetails(competitionId, { isAuthenticated });

  const handleRegister = useCallback(async () => {
    const { ok, error: err } = await register();
    if (!ok) {
      Alert.alert('Registration failed', err.message);
    } else {
      Alert.alert('You\u2019re in!', 'Your registration is confirmed.');
    }
  }, [register]);

  const handleWithdraw = useCallback(() => {
    Alert.alert('Withdraw registration?', 'You can register again later if spots remain.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          const { ok, error: err } = await withdraw();
          if (!ok) Alert.alert('Could not withdraw', err.message);
        },
      },
    ]);
  }, [withdraw]);

  const handleRequireLogin = useCallback(() => {
    navigation.navigate('Login', { returnTo: { screen: 'CompetitionDetails', params: { competitionId } } });
  }, [navigation, competitionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Couldn&apos;t load this competition</Text>
        <Text style={styles.errorSubtitle}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => reload()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const dateFormatter = (d) =>
    new Date(d).toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!!data.bannerImageUrl && (
          <Image source={{ uri: data.bannerImageUrl }} style={styles.banner} resizeMode="cover" />
        )}

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <StatusBadge phase={data.phase} />
            <Text style={styles.category}>{data.category}</Text>
          </View>

          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.host}>Hosted by {data.hostName}</Text>

          {data.countdownTarget && (
            <CountdownTimer
              targetDate={data.countdownTarget}
              label={data.countdownLabel}
              serverTime={data.serverTime}
              fetchedAt={fetchedAt}
              onComplete={() => reload({ silent: true })}
            />
          )}

          <View style={styles.infoRow}>
            <InfoCard label="Prize Pool" value={`₹${data.prizePool.toLocaleString()}`} accent />
            <View style={{ width: spacing.md }} />
            <InfoCard label="Entry Fee" value={data.entryFee > 0 ? `₹${data.entryFee}` : 'Free'} />
          </View>

          <SpotsProgressBar
            current={data.currentParticipantsCount}
            max={data.maxParticipants}
            spotsRemaining={data.spotsRemaining}
            isAlmostFull={data.isAlmostFull}
          />

          <Section title="About this competition">
            <Text style={styles.body}>{data.description}</Text>
          </Section>

          <Section title="Schedule">
            <ScheduleRow label="Registration opens" value={dateFormatter(data.registrationStartDate)} />
            <ScheduleRow label="Registration closes" value={dateFormatter(data.registrationEndDate)} />
            <ScheduleRow label="Competition starts" value={dateFormatter(data.competitionStartDate)} />
            <ScheduleRow label="Competition ends" value={dateFormatter(data.competitionEndDate)} />
          </Section>

          {data.rules?.length > 0 && (
            <Section title="Rules">
              {data.rules.map((rule, idx) => (
                <View key={idx} style={styles.ruleRow}>
                  <Text style={styles.ruleBullet}>{idx + 1}.</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </Section>
          )}

          {!!actionError && actionError.code !== 'ALREADY_REGISTERED' && (
            <Text style={styles.actionErrorText}>{actionError.message}</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <RegisterButton
          isAuthenticated={isAuthenticated}
          phase={data.phase}
          viewer={data.viewer}
          entryFee={data.entryFee}
          loading={actionLoading}
          onRegister={handleRegister}
          onWithdraw={handleWithdraw}
          onRequireLogin={handleRequireLogin}
        />
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ScheduleRow({ label, value }) {
  return (
    <View style={styles.scheduleRow}>
      <Text style={styles.scheduleLabel}>{label}</Text>
      <Text style={styles.scheduleValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  banner: { width: '100%', height: 220, backgroundColor: colors.surfaceAlt },
  content: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.sm },
  host: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: 'row', marginTop: spacing.lg },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleLabel: { ...typography.body, color: colors.textSecondary },
  scheduleValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  ruleRow: { flexDirection: 'row', marginBottom: spacing.xs },
  ruleBullet: { ...typography.body, color: colors.textMuted, width: 22 },
  ruleText: { ...typography.body, color: colors.textSecondary, flex: 1, lineHeight: 21 },
  actionErrorText: { ...typography.caption, color: colors.danger, marginTop: spacing.md },
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  errorTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  errorSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
