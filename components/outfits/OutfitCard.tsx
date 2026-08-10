import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import type { Outfit } from '@/data/types';

type Props = {
  outfit: Outfit;
  index: number;
};

export function OutfitCard({ outfit, index }: Props) {
  const { getItemsForOutfit } = useApp();
  const pieces = getItemsForOutfit(outfit).slice(0, 4);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/outfit/${outfit.id}`)}
      >
        <View style={styles.mosaic}>
          {pieces.length === 0 ? (
            <View style={[styles.tile, styles.emptyTile]}>
              <Text variant="caption" color={colors.muted}>
                Empty
              </Text>
            </View>
          ) : (
            pieces.map((item, i) => (
              <Image
                key={item.id}
                source={{ uri: item.imageUri }}
                style={[
                  styles.tile,
                  pieces.length === 1 && styles.tileSolo,
                  pieces.length === 3 && i === 0 && styles.tileWide,
                ]}
                contentFit="cover"
              />
            ))
          )}
          {outfit.isPinned ? (
            <View style={styles.pinBadge}>
              <Ionicons name="star" size={14} color={colors.white} />
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text variant="subtitle" numberOfLines={1}>
            {outfit.name}
          </Text>
          <Text variant="caption" color={colors.muted}>
            {outfit.isPinned ? 'Pinned · ' : ''}
            {outfit.occasion ? `${outfit.occasion} · ` : ''}
            {pieces.length} piece{pieces.length === 1 ? '' : 's'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  mosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 168,
    backgroundColor: colors.surfaceMuted,
  },
  pinBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: '50%',
    height: '50%',
    backgroundColor: colors.surfaceMuted,
  },
  tileSolo: {
    width: '100%',
    height: '100%',
  },
  tileWide: {
    width: '100%',
    height: '50%',
  },
  emptyTile: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    padding: spacing.md,
    gap: 4,
  },
});
