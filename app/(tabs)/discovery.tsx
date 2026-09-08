import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/constants/theme';

/**
 * Phase 1 shell — Discovery becomes real in Phase 6 of the roadmap.
 * Ships now so the 3-tab IA is complete and users understand the promise.
 */
export default function DiscoveryScreen() {
  return (
    <Screen scroll>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text variant="caption" color={colors.muted}>
          What could I wear?
        </Text>
        <Text variant="hero">Discovery</Text>
        <Text variant="body" color={colors.muted}>
          Inspiration, AI looks from your closet, occasions, and trends — coming
          next.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(420)}
        style={styles.card}
      >
        <View style={styles.iconBubble}>
          <Ionicons name="sparkles" size={22} color={colors.primary} />
        </View>
        <Text variant="subtitle">On the way</Text>
        <Text variant="body" color={colors.muted}>
          For You looks from what you already own, occasion collections (date
          night, wedding, brunch), and trending vibes. Vibe Match is live from
          Closet — Like → Match lands here in a later phase.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(140).duration(420)}
        style={styles.card}
      >
        <View style={styles.iconBubble}>
          <Ionicons name="shirt-outline" size={22} color={colors.primary} />
        </View>
        <Text variant="subtitle">Meanwhile</Text>
        <Text variant="body" color={colors.muted}>
          Use Today for what to wear now, and Closet to browse or add pieces.
          Discovery will pull from the same wardrobe — no duplicate library.
        </Text>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
