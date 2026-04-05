import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/src/theme';

type AvatarProps = {
  name: string;
  size?: number;
  uri?: string;
};

export const Avatar = ({ name, size = 52, uri }: AvatarProps) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderColor: colors.white,
    borderWidth: 2,
    justifyContent: 'center',
  },
  initials: {
    color: colors.ink,
    ...typography.label,
  },
});

