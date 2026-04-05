import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type BackHeaderProps = {
  title?: string;
  trailing?: ReactNode;
};

export const BackHeader = ({ title, trailing }: BackHeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather color={colors.ink} name="chevron-left" size={24} />
      </Pressable>
      <Text style={styles.title}>{title ?? ''}</Text>
      <View style={styles.trailing}>{trailing}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  back: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    color: colors.ink,
    flex: 1,
    textAlign: 'center',
    ...typography.h3,
  },
  trailing: {
    alignItems: 'flex-end',
    minWidth: 44,
  },
});
