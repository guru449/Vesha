import { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function Screen({
  children,
  scroll,
  padded = true,
  style,
  edges = ['top', 'left', 'right'],
}: Props) {
  const content = (
    <View style={[padded && styles.padded, style, styles.flex]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#E7F0EC', colors.bg, '#F5F2EE']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
