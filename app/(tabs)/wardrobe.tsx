import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import {
  HangingRail,
  ShoeShelf,
  SideShelf,
} from '@/components/wardrobe/ClosetCompartment';
import { useApp } from '@/context/AppContext';
import { closetWood, colors, radii, spacing } from '@/constants/theme';
import { searchClosetItems } from '@/lib/closetIntel';
import {
  closetSortModes,
  countWears,
  groupClosetSections,
  sortClosetSections,
  type ClosetSortMode,
} from '@/lib/closetSort';

export default function ClosetScreen() {
  const { items, user, wearHistory } = useApp();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<ClosetSortMode>('color');

  const searchResult = useMemo(
    () => searchClosetItems(items, query),
    [items, query],
  );

  const sections = useMemo(() => {
    const wearCounts = sortMode === 'worn' ? countWears(wearHistory) : undefined;
    return sortClosetSections(
      groupClosetSections(searchResult.items),
      sortMode,
      wearCounts,
    );
  }, [searchResult.items, sortMode, wearHistory]);

  const visibleCount = searchResult.items.length;
  const isSearching = query.trim().length > 0;
  const sortHint =
    sortMode === 'color'
      ? 'sorted by color ⟶'
      : sortMode === 'recent'
        ? 'newest first'
        : 'most worn first';

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Animated.View entering={FadeIn.duration(450)} style={styles.headerCopy}>
              <Text variant="caption" color={colors.muted} style={styles.eyebrow}>
                {user?.name
                  ? `${user.name}'s wardrobe · ${items.length} pieces`
                  : `Your wardrobe · ${items.length} pieces`}
              </Text>
              <Text variant="hero">Closet</Text>
            </Animated.View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a piece"
                onPress={() => router.push('/(tabs)/add')}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Ionicons name="add" size={22} color={colors.ink} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Account"
                onPress={() => router.push('/(tabs)/profile')}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Ionicons name="person-outline" size={20} color={colors.ink} />
              </Pressable>
            </View>
          </View>

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
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          {isSearching ? (
            <Text variant="caption" color={colors.muted}>
              {searchResult.headline
                ? searchResult.headline
                : `${visibleCount} of ${items.length} pieces match`}
            </Text>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipList}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {closetSortModes.map((mode) => (
            <Chip
              key={mode.key}
              label={mode.key === sortMode ? `Sort: ${mode.label}` : mode.label}
              selected={mode.key === sortMode}
              onPress={() => setSortMode(mode.key)}
            />
          ))}
          <Chip label="Saved looks →" onPress={() => router.push('/(tabs)/outfits')} />
          <Chip label="Vibe Match →" onPress={() => router.push('/vibe')} />
        </ScrollView>

        <View style={styles.wardrobe}>
          <LinearGradient
            colors={[closetWood.frameLight, closetWood.frameDark]}
            style={styles.frameFill}
            pointerEvents="none"
          />
          <View style={styles.main}>
            <HangingRail
              title="Tops"
              hint={sortHint}
              items={sections.tops}
              showSwatch={sortMode === 'color'}
              style={styles.hangingCompartment}
              emptyLabel={isSearching ? 'No tops match' : 'No tops yet'}
            />
            <HangingRail
              title="Bottoms"
              items={sections.bottoms}
              showSwatch={sortMode === 'color'}
              style={styles.hangingCompartment}
              emptyLabel={isSearching ? 'No bottoms match' : 'No bottoms yet'}
            />
            <ShoeShelf
              title="Footwear"
              items={sections.footwear}
              style={styles.shoeCompartment}
              emptyLabel={isSearching ? 'No footwear match' : 'No footwear yet'}
            />
          </View>
          <View style={styles.side}>
            <SideShelf
              title="Dresses"
              items={sections.dresses}
              style={styles.sideTop}
              emptyLabel={isSearching ? 'No match' : 'None yet'}
            />
            <SideShelf
              title="Extras"
              items={sections.extras}
              style={styles.sideBottom}
              emptyLabel={isSearching ? 'No match' : 'None yet'}
            />
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCloset}>
            <Text variant="subtitle" center>
              Your closet is empty
            </Text>
            <Text variant="body" color={colors.muted} center>
              Tap + on any rail to hang your first piece.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 11,
  },
  chipList: {
    flexGrow: 0,
    marginTop: spacing.sm,
  },
  chips: {
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  wardrobe: {
    flexGrow: 1,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: closetWood.edge,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingBottom: 0,
  },
  frameFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  main: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  side: {
    width: 78,
    gap: 8,
  },
  hangingCompartment: {
    flex: 1.15,
    minHeight: 158,
  },
  shoeCompartment: {
    flex: 0.85,
    minHeight: 122,
    justifyContent: 'flex-end',
  },
  sideTop: {
    flex: 1.35,
    minHeight: 220,
  },
  sideBottom: {
    flex: 1,
    minHeight: 130,
  },
  emptyCloset: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
});
