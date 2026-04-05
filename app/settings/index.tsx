import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { SettingsRow } from '@/src/components/layout/SettingsRow';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useAppStore } from '@/src/lib/app-store';
import { notificationsSupportedInCurrentRuntime, scheduleReminderPreview } from '@/src/lib/notifications';
import { colors, spacing, typography } from '@/src/theme';

export default function SettingsScreen() {
  const profile = useAppStore((state) => state.profile);

  return (
    <Screen>
      <BackHeader title="Settings" />
      <Text style={styles.sectionTitle}>General settings</Text>
      <View style={styles.stack}>
        <SettingsRow title="Update profile" subtitle={profile?.displayName} />
        <SettingsRow title="Notification settings" subtitle="Reminders, quiet hours, and categories." />
        <SettingsRow title="Preferred voice" subtitle={profile?.preferredVoice ?? 'Neutral, calm'} />
        <SettingsRow title="Privacy settings" subtitle="Export data, delete account, and AI disclosures." />
      </View>

      <Text style={styles.sectionTitle}>Safety and privacy</Text>
      <AppCard>
        <Text style={styles.cardTitle}>BubbleAI safety promise</Text>
        <Text style={styles.cardBody}>
          BubbleAI is supportive AI, not a doctor, not a crisis line, and not a replacement for professional care.
        </Text>
        <PillButton
          label="Preview reminder"
          onPress={async () => {
            const scheduled = await scheduleReminderPreview(
              'BubbleAI reminder',
              'Take one gentle minute to check in with yourself.',
            );

            if (!notificationsSupportedInCurrentRuntime) {
              Alert.alert(
                'Use a development build',
                'Expo Go on Android does not support this notification flow. Install the BubbleAI dev build to test reminders.',
              );
              return;
            }

            if (!scheduled) {
              Alert.alert('Permission needed', 'Enable notifications first to preview reminder alerts.');
              return;
            }

            Alert.alert('Scheduled', 'A local preview reminder was created.');
          }}
          variant="secondary"
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.h2,
  },
  stack: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  cardBody: {
    color: colors.inkMuted,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    ...typography.body,
  },
});
