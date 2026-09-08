import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ClothingCard } from '@/components/wardrobe/ClothingCard';
import { useApp } from '@/context/AppContext';
import {
  closetBuckets,
  colors,
  itemMatchesClosetBucket,
  radii,
  spacing,
  type ClosetBucket,
} from '@/constants/theme';
import { searchClosetItems } from '@/lib/closetIntel';

export default function ClosetScreen() {
  const { items, user } = useApp();
  const [query, setQuery] = useState('');
  const [bucket, setBucket] = useState<ClosetBucket>('All');

  const searchResult = useMemo(() => {
    const result = searchClosetItems(items, query);
    if (bucket === 'All') return result;
    return {
      ...result,
      items: result.items.filter((item) =>
        itemMatchesClosetBucket(item.attributes.category, bucket),
      ),
    };
  }, [items, query, bucket]);

  const filtered = searchResult.items;

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Animated.View entering={FadeIn.duration(450)} style={styles.headerCopy}>
            <Text variant="caption" color={colors.muted}>
              {user?.name ? `${user.name}'s pieces` : 'What do I own?'}
            </Text>
            <Text variant="hero">Closet</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Account"
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a piece"
              onPress={() => router.push('/(tabs)/add')}
              style={[styles.iconBtn, styles.addBtn]}
              hitSlop={8}
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <Text variant="body" color={colors.muted}>
          {query.trim() && searchResult.headline
            ? searchResult.headline
            : `${filtered.length} of ${items.length} pieces · tap a photo to open`}
        </Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder='Search, occasion, or “goes with…”'
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.looksLink}
          onPress={() => router.push('/(tabs)/outfits')}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            Saved looks
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filters}
        keyboardShouldPersistTaps="handled"
      >
        {closetBuckets.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={bucket === item}
            onPress={() => setBucket(item)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="subtitle" center>
              {items.length === 0 ? 'Your closet is empty' : 'No pieces match'}
            </Text>
            <Text variant="body" color={colors.muted} center>
              {items.length === 0
                ? 'Tap + to add your first piece.'
                : query.trim()
                  ? searchResult.mode === 'combo'
                    ? 'No strong pairings — try another piece or a simpler search.'
                    : 'Try a color, piece name, or occasion like wedding / work / date.'
                  : 'Try another filter or clear your search.'}
            </Text>
            {items.length === 0 ? (
              <Pressable
                style={styles.emptyAdd}
                onPress={() => router.push('/(tabs)/add')}
              >
                <Text variant="bodyMedium" color={colors.primary}>
                  Add a piece
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.cell}>
            <ClothingCard item={item} index={index} imageOnly />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMist,
  },
  addBtn: {
    backgroundColor: colors.primary,
  },
  search: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 12,
  },
  looksLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  filterList: {
    flexGrow: 0,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cell: {
    flex: 1,
  },
  empty: {
    paddingTop: spacing.xxl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  emptyAdd: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
