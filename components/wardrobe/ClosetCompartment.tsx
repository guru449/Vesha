import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { HangerPiece } from '@/components/wardrobe/HangerPiece';
import { Text } from '@/components/ui/Text';
import { closetWood, colors, radii, spacing } from '@/constants/theme';
import type { ClothingItem } from '@/data/types';

type BaseProps = {
  title: string;
  items: ClothingItem[];
  /** Small note next to the label, e.g. "sorted by color". */
  hint?: string;
  emptyLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Dark cavity with a wooden shelf along the bottom edge. */
function Cavity({
  title,
  hint,
  children,
  style,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.cavity, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{title.toUpperCase()}</Text>
        {hint ? (
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ) : null}
      </View>
      {children}
      <LinearGradient
        colors={['rgba(11,10,9,0)', closetWood.cavity]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[closetWood.shelfLight, closetWood.edge]}
        style={styles.shelf}
        pointerEvents="none"
      />
    </View>
  );
}

function AddSlot({ width, height }: { width: number; height: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a piece"
      onPress={() => router.push('/(tabs)/add')}
      style={[styles.addSlot, { width, height }]}
    >
      <Ionicons name="add" size={22} color={colors.muted} />
    </Pressable>
  );
}

function EmptyNote({ label, height }: { label: string; height: number }) {
  return (
    <View style={[styles.emptyNote, { height }]}>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
    </View>
  );
}

/** Tops / Bottoms: garments on hangers along a brass rail. */
export function HangingRail({
  title,
  items,
  hint,
  showSwatch,
  emptyLabel = 'Nothing hanging here yet',
  style,
}: BaseProps & { showSwatch?: boolean }) {
  return (
    <Cavity title={title} hint={hint} style={style}>
      <LinearGradient
        colors={[closetWood.railLight, closetWood.railDark]}
        style={styles.rail}
        pointerEvents="none"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hug}
        contentContainerStyle={styles.hangingRow}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item, index) => (
          <HangerPiece key={item.id} item={item} index={index} showSwatch={showSwatch} />
        ))}
        <View style={styles.addHanger}>
          <AddSlot width={76} height={96} />
        </View>
        {items.length === 0 ? (
          <View style={styles.addHanger}>
            <EmptyNote label={emptyLabel} height={96} />
          </View>
        ) : null}
      </ScrollView>
    </Cavity>
  );
}

/** Footwear: shoes lined up on the bottom shelf. */
export function ShoeShelf({
  title,
  items,
  hint,
  emptyLabel = 'No footwear yet',
  style,
}: BaseProps) {
  return (
    <Cavity title={title} hint={hint} style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hug}
        contentContainerStyle={styles.shoeRow}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.attributes.color}`}
            onPress={() => router.push(`/item/${item.id}`)}
            style={styles.shoe}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.fill}
              contentFit="cover"
              transition={240}
            />
          </Pressable>
        ))}
        <AddSlot width={84} height={62} />
        {items.length === 0 ? <EmptyNote label={emptyLabel} height={62} /> : null}
      </ScrollView>
    </Cavity>
  );
}

/** Narrow side compartment (dresses, jewelry, bags) — stacked, scrolls vertically. */
export function SideShelf({
  title,
  items,
  emptyLabel = 'Empty',
  style,
}: BaseProps) {
  return (
    <Cavity title={title} style={style}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sideColumn}
        nestedScrollEnabled
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.attributes.color}`}
            onPress={() => router.push(`/item/${item.id}`)}
            style={styles.mini}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.fill}
              contentFit="cover"
              transition={240}
            />
          </Pressable>
        ))}
        {items.length === 0 ? (
          <Text variant="caption" color={colors.muted} center>
            {emptyLabel}
          </Text>
        ) : null}
      </ScrollView>
    </Cavity>
  );
}

const styles = StyleSheet.create({
  cavity: {
    backgroundColor: closetWood.cavity,
    borderWidth: 2,
    borderColor: closetWood.edge,
    borderRadius: radii.sm,
    overflow: 'hidden',
    paddingTop: 24,
    paddingBottom: 14,
  },
  labelRow: {
    position: 'absolute',
    top: 6,
    left: 10,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.6,
    color: closetWood.label,
  },
  hintPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: '#2B2420',
  },
  hintText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: '#E5D9CC',
  },
  rail: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 24,
    height: 4,
    borderRadius: 2,
    zIndex: 2,
  },
  hug: {
    flexGrow: 0,
  },
  hangingRow: {
    paddingHorizontal: 10,
    paddingRight: 36,
    paddingTop: 2,
    gap: 10,
    alignItems: 'flex-start',
  },
  addHanger: {
    paddingTop: 16,
  },
  shoeRow: {
    paddingHorizontal: 10,
    paddingRight: 36,
    paddingTop: 2,
    gap: 10,
    alignItems: 'flex-end',
  },
  shoe: {
    width: 84,
    height: 62,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    boxShadow: '0 6px 10px rgba(0,0,0,0.7)',
    elevation: 5,
  },
  sideColumn: {
    paddingHorizontal: 8,
    gap: 8,
    paddingBottom: 4,
  },
  mini: {
    width: '100%',
    height: 54,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  addSlot: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNote: {
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 28,
    zIndex: 2,
  },
  shelf: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 8,
    zIndex: 3,
  },
});
