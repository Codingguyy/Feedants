import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { colors, radii, spacing, typography } from '../styles/theme';

/**
 * This app's scope is the Competition Details screen, not a full catalogue.
 * This tiny screen just lets you paste a competition _id (printed by
 * `npm run seed`) to jump straight into the details screen for demoing.
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const [id, setId] = useState('');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Feedants</Text>
        <Text style={styles.subtitle}>
          Paste a competition ID (printed by `npm run seed` on the backend) to open its details
          screen.
        </Text>
        <TextInput
          style={styles.input}
          value={id}
          onChangeText={setId}
          placeholder="e.g. 66f1a2b3c4d5e6f7a8b9c0d1"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, !id && styles.buttonDisabled]}
          disabled={!id}
          onPress={() => navigation.navigate('CompetitionDetails', { competitionId: id.trim() })}
        >
          <Text style={styles.buttonText}>Open Competition</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.h2, color: '#fff' },
});
