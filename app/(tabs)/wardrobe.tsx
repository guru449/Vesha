import { Ionicons } from '@expo/vector-icons';
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
  categories,
  colors,
  radii,
  spacing,
  type Category,
} from '@/constants/theme';
import { matchesSearch } from '@/lib/search';

export default function WardrobeScreen() {
  const { items, user } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        category === 'All' || item.attributes.category === category;
      const matchesQuery = matchesSearch(
        [
          item.name,
          item.attributes.color,
          item.attributes.style,
          item.attributes.material,
          item.attributes.occasion,
          item.attributes.category,
          item.attributes.pattern,
          item.attributes.brand ?? '',
        ],
        query,
      );
      return matchesCategory && matchesQuery;
    });
  }, [items, query, category]);

  const header = (
    <View>
      <View style={styles.header}>
        <Animated.View entering={FadeIn.duration(450)}>
          <Text variant="caption" color={colors.muted}>
            {user?.name ? `${user.name}'s closet` : 'Your closet'}
          </Text>
          <Text variant="hero">Wardrobe</Text>
        </Animated.View>
        <Text variant="body" color={colors.muted}>
          {filtered.length} of {items.length} pieces · tap any item to edit
        </Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search color, style, fabric…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filters}
        keyboardShouldPersistTaps="handled"
      >
        {categories.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
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
        stickyHeaderIndices={[]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="subtitle" center>
              No pieces match
            </Text>
            <Text variant="body" color={colors.muted} center>
              Try another category or clear your search.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.cell}>
            <ClothingCard item={item} index={index} />
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
  search: {
    marginTop: spacing.sm,
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
  },
});
