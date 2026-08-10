import { Image } from 'expo-image';
import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/constants/theme';
import type { ClothingItem, Outfit } from '@/data/types';

type Props = {
  outfit: Pick<Outfit, 'name' | 'occasion'>;
  pieces: ClothingItem[];
};

/** Off-screen card captured as the share image. */
export const OutfitShareCard = forwardRef<View, Props>(
  function OutfitShareCard({ outfit, pieces }, ref) {
    const tiles = pieces.slice(0, 4);

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <Text variant="caption" color={colors.primary}>
          Vesha
        </Text>
        <Text variant="title" numberOfLines={2}>
          {outfit.name}
        </Text>
        <Text variant="caption" color={colors.muted}>
          {outfit.occasion ? `${outfit.occasion} · ` : ''}
          {pieces.length} piece{pieces.length === 1 ? '' : 's'}
        </Text>

        <View style={styles.mosaic}>
          {tiles.length === 0 ? (
            <View style={[styles.tile, styles.tileEmpty]} />
          ) : (
            tiles.map((item, index) => (
              <Image
                key={item.id}
                source={{ uri: item.imageUri }}
                style={[
                  styles.tile,
                  tiles.length === 1 && styles.tileSolo,
                  tiles.length === 3 && index === 0 && styles.tileWide,
                ]}
                contentFit="cover"
              />
            ))
          )}
        </View>

        <View style={styles.pieceList}>
          {pieces.slice(0, 4).map((item) => (
            <Text
              key={item.id}
              variant="caption"
              color={colors.inkSoft}
              numberOfLines={1}
            >
              {item.attributes.color} {item.attributes.category.toLowerCase()}
              {' · '}
              {item.name}
            </Text>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mosaic: {
    marginTop: spacing.sm,
    height: 200,
    borderRadius: radii.md,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceMuted,
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
  },
  tileEmpty: {
    width: '100%',
    height: '100%',
  },
  pieceList: {
    gap: 4,
    marginTop: spacing.xs,
  },
});
