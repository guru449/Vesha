import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

/** Web: center a phone-sized frame for realistic mobile UI reviews. */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.device}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
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
