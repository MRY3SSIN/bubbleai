import { View } from 'react-native';

import { colors, radii } from '@/src/theme';

export const BubblePattern = () => (
  <View
    style={{
      height: 280,
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#0D1917',
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    }}
  >
    {Array.from({ length: 8 }).map((_, column) => (
      <View
        key={`column-${column}`}
        style={{
          position: 'absolute',
          left: `${column * 14}%`,
          top: column % 2 === 0 ? 40 : 10,
          width: 74,
          height: 300,
          borderRadius: radii.xl,
          backgroundColor: column % 3 === 0 ? colors.mint : colors.mintSoft,
          opacity: column % 2 === 0 ? 0.9 : 0.72,
        }}
      />
    ))}
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120,
        backgroundColor: colors.background,
        borderTopLeftRadius: 80,
        borderTopRightRadius: 80,
      }}
    />
  </View>
);

