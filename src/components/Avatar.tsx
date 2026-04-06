import { Image, StyleSheet, Text, View } from 'react-native';

import type { AvatarTheme } from '@/src/types/domain';
import { colors, typography } from '@/src/theme';

type AvatarProps = {
  name: string;
  size?: number;
  uri?: string;
  theme?: AvatarTheme;
};

const avatarThemes: Record<AvatarTheme, string> = {
  mint: colors.cardStrong,
  ocean: '#D9EDF9',
  sunrise: '#FCE8D8',
  lavender: '#ECE7FB',
  forest: '#DDEDE6',
};

export const Avatar = ({ name, size = 52, uri, theme = 'mint' }: AvatarProps) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarThemes[theme],
        },
      ]}
    >
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    borderColor: colors.white,
    borderWidth: 2,
    justifyContent: 'center',
  },
  initials: {
    color: colors.ink,
    ...typography.label,
  },
});
