import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { AppCard } from '@/src/components/AppCard';
import { PillButton } from '@/src/components/PillButton';
import { SettingsRow } from '@/src/components/layout/SettingsRow';
import { Screen } from '@/src/components/layout/Screen';
import { authService } from '@/src/lib/auth';
import { useAppStore } from '@/src/lib/app-store';
import { getCycleInsight } from '@/src/lib/cycle-support';
import { colors, spacing, typography } from '@/src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const trustedContacts = useAppStore((state) => state.trustedContacts);
  const cycleProfile = useAppStore((state) => state.cycleProfile);
  const cycleInsight = getCycleInsight(cycleProfile);

  if (!profile) {
    return null;
  }

  return (
    <Screen>
      <View style={styles.top}>
        <Avatar
          name={profile.fullName}
          size={92}
          theme={profile.avatarTheme}
          uri={profile.avatarUrl}
        />
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.badge}>Bubble+</Text>
      </View>

      <Text style={styles.sectionTitle}>Personal details</Text>
      <View style={styles.stack}>
        <SettingsRow
          title="Edit profile"
          subtitle="Photo, name, voice, symptoms, and habits."
          onPress={() => router.push('/settings/profile')}
        />
        <SettingsRow
          title="Medical ID"
          subtitle="Clinician details, allergies, and support notes."
          onPress={() => router.push('/settings/medical-id')}
        />
        <SettingsRow
          title="Emergency contacts"
          subtitle={trustedContacts[0]?.name ?? 'Add someone you trust.'}
          onPress={() => router.push('/settings/emergency-contacts')}
        />
        <SettingsRow
          title="Cycle-aware support"
          subtitle={
            cycleInsight?.title ??
            (profile.menstrualSupportEnabled
              ? 'Cycle support is on and ready to personalize.'
              : 'Optional menstrual wellness support.')
          }
          onPress={() => router.push('/settings/cycle-support')}
        />
      </View>

      <Text style={styles.sectionTitle}>Trusted support</Text>
      <View style={styles.stack}>
        {trustedContacts.map((contact) => (
          <AppCard key={contact.id}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactMeta}>{contact.relationship}</Text>
            <Text style={styles.contactMeta}>{contact.phone}</Text>
          </AppCard>
        ))}
      </View>

      <PillButton label="Settings" onPress={() => router.push('/settings')} variant="secondary" />
      <View style={{ height: spacing.md }} />
      <PillButton
        label="Sign Out"
        onPress={async () => {
          await authService.logout();
          router.replace('/(public)');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    marginTop: spacing.lg,
  },
  name: {
    color: colors.ink,
    marginTop: spacing.lg,
    ...typography.h1,
  },
  badge: {
    color: colors.mint,
    marginTop: spacing.sm,
    ...typography.label,
  },
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.h2,
  },
  stack: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  contactName: {
    color: colors.ink,
    ...typography.h3,
  },
  contactMeta: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
    ...typography.caption,
  },
});
