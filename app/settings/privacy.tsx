import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import {
  useDeleteAccount,
  useExportData,
  usePrivacySettings,
  useUpdatePrivacySettings,
} from '@/src/features/profile/use-profile';
import { colors, spacing, typography } from '@/src/theme';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { data: privacySettings } = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacySettings();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();

  const settings = privacySettings ?? {
    privateMode: false,
    hideNotificationPreviews: true,
  };

  const toggle = async (key: 'privateMode' | 'hideNotificationPreviews') => {
    try {
      await updatePrivacy.mutateAsync({ [key]: !settings[key] });
    } catch (error) {
      Alert.alert(
        'Unable to update privacy settings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const exportMyData = async () => {
    try {
      await exportData.mutateAsync();
    } catch (error) {
      Alert.alert(
        'Unable to export data',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This removes your BubbleAI account and personal wellness data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              router.replace('/(public)');
            } catch (error) {
              Alert.alert(
                'Unable to delete account',
                error instanceof Error ? error.message : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <BackHeader title="Privacy settings" />

      <Text style={styles.sectionTitle}>Trust and privacy</Text>
      <View style={styles.stack}>
        <AppCard>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>Private mode</Text>
              <Text style={styles.cardBody}>
                Hides your name and journal previews on shared surfaces around the app.
              </Text>
            </View>
            <Switch
              onValueChange={() => toggle('privateMode')}
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.mint }}
              value={settings.privateMode}
            />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>Hide notification previews</Text>
              <Text style={styles.cardBody}>
                Keeps reminder details hidden inside the app list and future notification surfaces.
              </Text>
            </View>
            <Switch
              onValueChange={() => toggle('hideNotificationPreviews')}
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.mint }}
              value={settings.hideNotificationPreviews}
            />
          </View>
        </AppCard>
      </View>

      <Text style={styles.sectionTitle}>Control your data</Text>
      <View style={styles.stack}>
        <AppCard>
          <Text style={styles.cardTitle}>Export your BubbleAI data</Text>
          <Text style={styles.cardBody}>
            Download your profile, check-ins, journals, recommendations, and conversations as a JSON file.
          </Text>
          <PillButton
            label="Export my data"
            loading={exportData.isPending}
            onPress={exportMyData}
            variant="secondary"
          />
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Delete account</Text>
          <Text style={styles.cardBody}>
            Permanently remove your account and connected wellness records from BubbleAI.
          </Text>
          <PillButton
            label="Delete account"
            loading={deleteAccount.isPending}
            onPress={confirmDelete}
            variant="danger"
          />
        </AppCard>
      </View>

      <Text style={styles.sectionTitle}>AI and safety info</Text>
      <AppCard>
        <Text style={styles.cardTitle}>How BubbleAI handles support</Text>
        <Text style={styles.cardBody}>
          BubbleAI is supportive AI, not a doctor, not a crisis line, and not a replacement for professional care.
        </Text>
        <Text style={styles.cardBody}>
          When messages suggest serious risk, BubbleAI shifts away from routine coaching and points you toward human help.
        </Text>
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  cardBody: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body,
  },
});
