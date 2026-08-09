import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { colors } from '@/constants/theme';

/**
 * Web shell:
 * - Desktop/tablet: phone frame (great for investor demos)
 * - Real mobile browser: full-bleed (no nested phone chrome)
 */
export function PhoneShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  if (isCompact) {
    return <View style={styles.full}>{children}</View>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.device}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
  },
  page: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDE5E1',
    paddingVertical: 24,
  },
  device: {
    width: 390,
    maxWidth: '100%',
    height: '100%',
    maxHeight: 844,
    backgroundColor: colors.bg,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C5D0CA',
  },
});
