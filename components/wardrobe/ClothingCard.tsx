import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { colors, radii } from '@/constants/theme';
import type { ClothingItem } from '@/data/types';

type Props = {
  item: ClothingItem;
  index: number;
  /** Image-first Closet grid — hide name/meta under the photo */
  imageOnly?: boolean;
};

export function ClothingCard({ item, index, imageOnly = false }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(18)}
      style={styles.flex}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.name}
          onPress={() => router.push(`/item/${item.id}`)}
          onPressIn={() => {
            scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 14, stiffness: 240 });
          }}
          style={styles.pressable}
        >
          <Image
            source={{ uri: item.imageUri }}
            style={[styles.image, imageOnly && styles.imageTall]}
            contentFit={imageOnly ? 'contain' : 'cover'}
            transition={280}
          />
          {imageOnly ? (
            <View style={styles.pip}>
              <Text variant="caption" color={colors.white} numberOfLines={1}>
                {item.attributes.category}
              </Text>
            </View>
          ) : (
            <View style={styles.meta}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {item.name}
              </Text>
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {item.attributes.color} · {item.attributes.category}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressable: {
    flex: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: colors.surfaceMuted,
  },
  imageTall: {
    aspectRatio: 0.72,
    backgroundColor: colors.bgElevated,
  },
  pip: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    maxWidth: '86%',
    backgroundColor: colors.overlay,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  meta: {
    padding: 12,
    gap: 4,
  },
});
