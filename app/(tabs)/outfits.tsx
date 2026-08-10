import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { OutfitCard } from '@/components/outfits/OutfitCard';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import { sortOutfits } from '@/lib/outfits';

export default function OutfitsScreen() {
  const { outfits } = useApp();
  const sorted = useMemo(() => sortOutfits(outfits), [outfits]);
  const pinnedCount = sorted.filter((outfit) => outfit.isPinned).length;

  return (
    <Screen padded={false}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Animated.View entering={FadeIn.duration(400)}>
              <Text variant="caption" color={colors.muted}>
                Style your closet
              </Text>
              <Text variant="hero">Outfits</Text>
            </Animated.View>
            <Text variant="body" color={colors.muted}>
              Combine pieces into looks you can reuse. Pin favorites to keep
              them on top.
            </Text>
            {pinnedCount > 0 ? (
              <Text variant="caption" color={colors.primary}>
                {pinnedCount} pinned
              </Text>
            ) : null}
            <Button
              label="Create outfit"
              onPress={() => router.push('/outfit/create')}
              style={styles.createBtn}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
            </View>
            <Text variant="subtitle" center>
              No outfits yet
            </Text>
            <Text variant="body" color={colors.muted} center>
              Pick tops, bottoms, shoes and more from your wardrobe.
            </Text>
            <Button
              label="Build your first outfit"
              onPress={() => router.push('/outfit/create')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <OutfitCard outfit={item} index={index} />
        )}
      />

      {outfits.length > 0 ? (
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/outfit/create')}
          accessibilityRole="button"
          accessibilityLabel="Create outfit"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  header: {
    paddingTop: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  createBtn: {
    marginTop: spacing.sm,
  },
  empty: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
