import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { colors, radii } from '@/constants/theme';
import type { ClothingItem } from '@/data/types';
import {
  buildAvatarLayers,
  heightScale,
  type AvatarLayerSlot,
} from '@/lib/avatarLayout';

type Props = {
  pieces: ClothingItem[];
  /** Optional full-body / face photo from profile */
  avatarUri?: string | null;
  heightCm?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Show mosaic fallback label when empty */
  emptyLabel?: string;
};

const SLOT_STYLE: Record<
  AvatarLayerSlot,
  { top: `${number}%`; height: `${number}%`; width: `${number}%` }
> = {
  dress: { top: '22%', height: '52%', width: '62%' },
  top: { top: '20%', height: '28%', width: '58%' },
  bottom: { top: '46%', height: '32%', width: '52%' },
  shoes: { top: '78%', height: '16%', width: '44%' },
  accessory: { top: '12%', height: '14%', width: '28%' },
  jewelry: { top: '16%', height: '10%', width: '22%' },
};

/**
 * Stylized try-on: silhouette + layered garment slots.
 * Falls back to a piece mosaic when there are no mappable layers.
 */
export function OutfitAvatar({
  pieces,
  avatarUri,
  heightCm,
  compact,
  style,
  emptyLabel = 'Add pieces to preview',
}: Props) {
  const layers = useMemo(() => buildAvatarLayers(pieces), [pieces]);
  const scale = heightScale(heightCm);

  if (layers.length === 0) {
    if (pieces.length === 0) {
      return (
        <View style={[styles.root, compact && styles.rootCompact, style]}>
          <View style={styles.empty}>
            <Text variant="caption" color={colors.muted} center>
              {emptyLabel}
            </Text>
          </View>
        </View>
      );
    }
    // Unmapped categories only — mosaic fallback (never crash).
    return (
      <View style={[styles.root, compact && styles.rootCompact, style]}>
        <View style={styles.mosaic}>
          {pieces.slice(0, 4).map((item) => (
            <Image
              key={item.id}
              source={{ uri: item.imageUri }}
              style={styles.mosaicTile}
              contentFit="cover"
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, compact && styles.rootCompact, style]}>
      <View style={[styles.stage, { transform: [{ scaleY: scale }] }]}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarPhoto}
            contentFit="cover"
          />
        ) : (
          <Silhouette />
        )}

        {layers.map((layer) => {
          const layout = SLOT_STYLE[layer.slot];
          const isAccent =
            layer.slot === 'accessory' || layer.slot === 'jewelry';
          return (
            <View
              key={`${layer.slot}-${layer.item.id}`}
              style={[
                styles.slot,
                {
                  top: layout.top,
                  height: layout.height,
                  width: layout.width,
                  zIndex: layer.zIndex,
                  borderRadius: isAccent ? radii.pill : radii.md,
                },
                compact && styles.slotCompact,
              ]}
            >
              <Image
                source={{ uri: layer.item.imageUri }}
                style={styles.garment}
                contentFit="cover"
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Silhouette() {
  return (
    <View style={styles.silRoot} pointerEvents="none">
      <LinearGradient
        colors={[colors.primaryMist, colors.surfaceMuted]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.head} />
      <View style={styles.neck} />
      <View style={styles.torso} />
      <View style={styles.hips} />
      <View style={styles.legs}>
        <View style={styles.leg} />
        <View style={styles.leg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  rootCompact: {
    aspectRatio: 0.85,
    borderRadius: radii.md,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  avatarPhoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.55,
  },
  silRoot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    paddingTop: '8%',
  },
  head: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#C9B8A8',
  },
  neck: {
    width: '6%',
    height: '4%',
    backgroundColor: '#C9B8A8',
    marginTop: -2,
  },
  torso: {
    width: '42%',
    height: '28%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#D7C4B4',
  },
  hips: {
    width: '36%',
    height: '6%',
    backgroundColor: '#CDB9A8',
    marginTop: -4,
  },
  legs: {
    flexDirection: 'row',
    width: '36%',
    height: '34%',
    justifyContent: 'space-between',
  },
  leg: {
    width: '42%',
    backgroundColor: '#C9B8A8',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  slot: {
    position: 'absolute',
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  slotCompact: {
    borderWidth: 0.5,
  },
  garment: {
    width: '100%',
    height: '100%',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  mosaic: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mosaicTile: {
    width: '50%',
    height: '50%',
  },
});
