import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useNotificationSettings } from '@/src/features/profile/use-profile';
import { dataService } from '@/src/lib/data-service';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '@/src/theme';

export default function NotificationsScreen() {
  const { data: settings } = useNotificationSettings();
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dataService.listNotifications(),
  });
  const [updating, setUpdating] = useState(false);

  const toggle = async (key: 'dailyCheckin' | 'journaling' | 'bedtime' | 'hydration' | 'movement') => {
    if (!settings) return;
    setUpdating(true);
    await dataService.updateNotificationSettings({ [key]: !settings[key] });
    setUpdating(false);
  };

  return (
    <Screen>
      <SectionHeader title="Notifications center" eyebrow="Gentle reminders" />
      <View style={styles.stack}>
        {settings
          ? ([
              ['dailyCheckin', 'Daily check-in'],
              ['journaling', 'Journaling reminder'],
              ['bedtime', 'Bedtime reminder'],
              ['hydration', 'Hydration reminder'],
              ['movement', 'Gentle movement'],
            ] as const).map(([key, label]) => (
              <AppCard key={key}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{label}</Text>
                  <Switch
                    disabled={updating}
                    onValueChange={() => toggle(key)}
                    thumbColor={colors.white}
                    trackColor={{ false: colors.border, true: colors.mint }}
                    value={settings[key]}
                  />
                </View>
              </AppCard>
            ))
          : null}
      </View>

      <SectionHeader title="In-app list" />
      <View style={styles.stack}>
        {notifications?.map((item) => (
          <AppCard key={item.id}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toDateString()}</Text>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: colors.ink,
    ...typography.h3,
    fontSize: 18,
  },
  body: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body,
  },
  meta: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.caption,
  },
});

