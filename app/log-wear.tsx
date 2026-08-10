import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import type { ClothingItem, Outfit } from '@/data/types';
import {
  formatDayHeading,
  recentDayOptions,
  toDayKey,
  wornAtForDayKey,
} from '@/lib/wearCalendar';

type Mode = 'outfit' | 'item';

export default function LogWearScreen() {
  const { day: dayParam } = useLocalSearchParams<{ day?: string }>();
  const {
    outfits,
    items,
    markOutfitWorn,
    markItemWorn,
    getItemsForOutfit,
  } = useApp();
  const insets = useSafeAreaInsets();
  const dayOptions = useMemo(() => recentDayOptions(14), []);
  const todayKey = toDayKey(new Date());

  const initialDay =
    dayParam && dayOptions.some((day) => day.key === dayParam)
      ? dayParam
      : todayKey;

  const [dayKey, setDayKey] = useState(initialDay);
  const [mode, setMode] = useState<Mode>(
    outfits.length ? 'outfit' : 'item',
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  const onLogOutfit = async (outfit: Outfit) => {
    setSavingId(outfit.id);
    try {
      await markOutfitWorn(outfit.id, undefined, {
        wornAt: wornAtForDayKey(dayKey),
      });
      router.back();
    } finally {
      setSavingId(null);
    }
  };

  const onLogItem = async (item: ClothingItem) => {
    setSavingId(item.id);
    try {
      await markItemWorn(item.id, {
        wornAt: wornAtForDayKey(dayKey),
      });
      router.back();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Log a look' }} />
      <View
        style={[
          styles.root,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <View style={styles.header}>
          <Text variant="body" color={colors.muted}>
            Forgot to mark something? Pick the day, then tap an outfit or
            piece.
          </Text>
          <Text variant="caption" color={colors.primary}>
            {formatDayHeading(dayKey)}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
        >
          {dayOptions.map((day) => {
            const selected = day.key === dayKey;
            return (
              <Pressable
                key={day.key}
                onPress={() => setDayKey(day.key)}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
              >
                <Text
                  variant="caption"
                  color={selected ? colors.white : colors.muted}
                >
                  {day.isToday ? 'Today' : day.shortLabel.split(',')[0]}
                </Text>
                <Text
                  variant="bodyMedium"
                  color={selected ? colors.white : colors.ink}
                >
                  {Number(day.key.slice(-2))}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeChip, mode === 'outfit' && styles.modeSelected]}
            onPress={() => setMode('outfit')}
          >
            <Text
              variant="bodyMedium"
              color={mode === 'outfit' ? colors.white : colors.inkSoft}
            >
              Outfit
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, mode === 'item' && styles.modeSelected]}
            onPress={() => setMode('item')}
          >
            <Text
              variant="bodyMedium"
              color={mode === 'item' ? colors.white : colors.inkSoft}
            >
              Piece
            </Text>
          </Pressable>
        </View>

        {mode === 'outfit' ? (
          <FlatList
            data={outfits}
            keyExtractor={(outfit) => outfit.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="subtitle">No saved outfits</Text>
                <Text variant="body" color={colors.muted}>
                  Switch to Piece, or create an outfit first.
                </Text>
              </View>
            }
            renderItem={({ item: outfit }) => {
              const pieces = getItemsForOutfit(outfit).slice(0, 3);
              const busy = savingId === outfit.id;
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => onLogOutfit(outfit)}
                  disabled={Boolean(savingId)}
                >
                  <View style={styles.mosaic}>
                    {pieces.map((piece) => (
                      <Image
                        key={piece.id}
                        source={{ uri: piece.imageUri }}
                        style={styles.tile}
                        contentFit="cover"
                      />
                    ))}
                    {pieces.length === 0 ? (
                      <View style={[styles.tile, styles.tileEmpty]} />
                    ) : null}
                  </View>
                  <View style={styles.meta}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {outfit.name}
                    </Text>
                    <Text variant="caption" color={colors.muted}>
                      {outfit.occasion ||
                        `${outfit.itemIds.length} piece${outfit.itemIds.length === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="subtitle">Wardrobe is empty</Text>
                <Text variant="body" color={colors.muted}>
                  Add a piece before logging wears.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const busy = savingId === item.id;
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => onLogItem(item)}
                  disabled={Boolean(savingId)}
                >
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.itemThumb}
                    contentFit="cover"
                  />
                  <View style={styles.meta}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" color={colors.muted}>
                      {item.attributes.category}
                      {item.attributes.color
                        ? ` · ${item.attributes.color}`
                        : ''}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  dayRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dayChip: {
    width: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  modeSelected: {
    backgroundColor: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  mosaic: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceMuted,
  },
  tile: {
    width: '50%',
    height: '50%',
  },
  tileEmpty: {
    width: '100%',
    height: '100%',
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  empty: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
});
