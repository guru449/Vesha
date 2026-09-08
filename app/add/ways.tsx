import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import {
  buildLookAroundItem,
  findPairingsForItem,
} from '@/lib/closetIntel';

/**
 * Post-add value screen: Photo → AI → Confirm → Added → ways to wear it.
 */
export default function WaysToWearScreen() {
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const { items } = useApp();
  const insets = useSafeAreaInsets();

  const item = useMemo(
    () => items.find((row) => row.id === itemId),
    [items, itemId],
  );

  const pairings = useMemo(
    () => (item ? findPairingsForItem(item, items, 3) : []),
    [item, items],
  );

  if (!item) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Piece not found</Text>
        <Button
          label="Back to Closet"
          onPress={() => router.replace('/(tabs)/wardrobe')}
        />
      </View>
    );
  }

  const onCreateLook = () => {
    const itemIds = buildLookAroundItem(item, items);
    router.push({
      pathname: '/outfit/create',
      params: { prefillIds: itemIds.join(',') },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ways to wear it' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: item.imageUri }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroMeta}>
            <Text variant="caption" color={colors.primary}>
              Just added
            </Text>
            <Text variant="title">{item.name}</Text>
            <Text variant="body" color={colors.muted}>
              Here are {pairings.length || 'a few'} ways to wear it with what you
              already own.
            </Text>
          </View>
        </View>

        {pairings.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="bodyMedium">Not enough pieces to pair yet</Text>
            <Text variant="body" color={colors.muted}>
              Add a couple more tops, bottoms, or shoes and we’ll suggest combos
              automatically.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text variant="caption" color={colors.muted}>
              Possible pairings
            </Text>
            {pairings.map((piece) => (
              <Pressable
                key={piece.id}
                style={styles.row}
                onPress={() => router.push(`/item/${piece.id}`)}
              >
                <Image
                  source={{ uri: piece.imageUri }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.rowMeta}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {piece.name}
                  </Text>
                  <Text variant="caption" color={colors.muted}>
                    {piece.attributes.color} · {piece.attributes.category}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        <Button label="Create a look with this" onPress={onCreateLook} />
        <Button
          label="Done — back to Closet"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/wardrobe')}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  heroImage: {
    width: 88,
    height: 110,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  empty: {
    gap: spacing.sm,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  rowMeta: {
    flex: 1,
    gap: 2,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
});
