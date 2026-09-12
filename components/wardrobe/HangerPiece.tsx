import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { closetWood, colors } from '@/constants/theme';
import type { ClothingItem } from '@/data/types';
import { colorSwatchHex } from '@/lib/closetSort';

export const HANGER_PIECE_WIDTH = 76;

type Props = {
  item: ClothingItem;
  index: number;
  /** Show the color swatch strip under the photo (color-sorted rails). */
  showSwatch?: boolean;
  width?: number;
  height?: number;
};

/** A garment hanging from a wooden hanger — used on the Tops / Bottoms rails. */
export function HangerPiece({
  item,
  index,
  showSwatch = false,
  width = HANGER_PIECE_WIDTH,
  height = 96,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 45).springify().damping(18)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.attributes.color}`}
        onPress={() => router.push(`/item/${item.id}`)}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 16, stiffness: 280 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 240 });
        }}
      >
        <Animated.View style={[styles.wrap, { width }, animatedStyle]}>
          <View style={styles.hook} />
          <View style={[styles.shoulders, { borderLeftWidth: width / 2, borderRightWidth: width / 2 }]} />
          <View style={[styles.garment, { width, height }]}>
            <Image
              source={{ uri: item.imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={240}
            />
            {showSwatch ? (
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: colorSwatchHex(item.attributes.color) },
                ]}
              />
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  hook: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: closetWood.hanger,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  shoulders: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomWidth: 9,
    borderBottomColor: closetWood.hanger,
    marginTop: -1,
  },
  garment: {
    marginTop: -3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    boxShadow: '0 8px 14px rgba(0,0,0,0.7)',
    elevation: 6,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  swatch: {
    height: 4,
    width: '100%',
  },
});
