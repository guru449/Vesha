import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import type { ClothingItem, WearHistoryEntry } from '@/data/types';
import {
  buildWornMonthSections,
  formatDayHeading,
  previewItemsForDay,
  toDayKey,
  type WornDay,
} from '@/lib/wearCalendar';

function WearEntryCard({
  entry,
  getItemsByIds,
}: {
  entry: WearHistoryEntry;
  getItemsByIds: (ids: string[]) => ClothingItem[];
}) {
  const pieces = getItemsByIds(entry.itemIds);
  const isItem =
    entry.source === 'item' || (!entry.outfitId && entry.itemIds.length === 1);

  return (
    <Pressable
      style={styles.entryCard}
      onPress={() => {
        if (isItem && entry.itemIds[0]) {
          router.push(`/item/${entry.itemIds[0]}`);
          return;
        }
        if (entry.outfitId) {
          router.push(`/outfit/${entry.outfitId}`);
        }
      }}
    >
      <View style={styles.entryMosaic}>
        {pieces.slice(0, 4).map((item) => (
          <Image
            key={item.id}
            source={{ uri: item.imageUri }}
            style={styles.entryTile}
            contentFit="cover"
          />
        ))}
        {pieces.length === 0 ? (
          <View style={[styles.entryTile, styles.entryTileEmpty]} />
        ) : null}
      </View>
      <View style={styles.entryMeta}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {entry.outfitName}
        </Text>
        <Text variant="caption" color={colors.primary}>
          {isItem ? 'Item' : 'Outfit'}
          {entry.occasion ? ` · ${entry.occasion}` : ''}
        </Text>
        <Text variant="caption" color={colors.muted}>
          {new Date(entry.wornAt).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function DayRow({
  day,
  expanded,
  onToggle,
  itemsById,
  getItemsByIds,
  index,
}: {
  day: WornDay;
  expanded: boolean;
  onToggle: () => void;
  itemsById: Map<string, ClothingItem>;
  getItemsByIds: (ids: string[]) => ClothingItem[];
  index: number;
}) {
  const thumbs = previewItemsForDay(day.entries, itemsById, 3);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(320)}
    >
      <Pressable
        style={[styles.dayRow, expanded && styles.dayRowExpanded]}
        onPress={onToggle}
      >
        <View style={styles.dayDateCol}>
          <Text variant="caption" color={colors.muted}>
            {day.shortLabel.split(',')[0] || day.shortLabel.split(' ')[0]}
          </Text>
          <Text
            variant="subtitle"
            color={day.isToday ? colors.primary : colors.ink}
          >
            {Number(day.key.slice(-2))}
          </Text>
          {day.isToday ? (
            <Text variant="caption" color={colors.primary}>
              Today
            </Text>
          ) : null}
        </View>

        <View style={styles.dayBody}>
          <View style={styles.dayTop}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {day.entries.length === 1
                ? day.entries[0]!.outfitName
                : `${day.entries.length} looks logged`}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.muted}
            />
          </View>
          <View style={styles.dayThumbs}>
            {thumbs.map((item) => (
              <Image
                key={item.id}
                source={{ uri: item.imageUri }}
                style={styles.dayThumb}
                contentFit="cover"
              />
            ))}
            <Text variant="caption" color={colors.muted} numberOfLines={1}>
              {day.entries.length > 1
                ? day.entries
                    .map((entry) => entry.outfitName)
                    .slice(0, 2)
                    .join(' · ') + (day.entries.length > 2 ? '…' : '')
                : day.entries[0]?.occasion ||
                  (day.entries[0]?.source === 'item' ? 'Item' : 'Outfit')}
            </Text>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expandedList}>
          <Text variant="caption" color={colors.muted}>
            {formatDayHeading(day.key)}
          </Text>
          {day.entries.map((entry) => (
            <WearEntryCard
              key={entry.id}
              entry={entry}
              getItemsByIds={getItemsByIds}
            />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function WearCalendarScreen() {
  const { wearHistory, items, getItemsByIds } = useApp();
  const insets = useSafeAreaInsets();
  const todayKey = toDayKey(new Date());

  const sections = useMemo(
    () => buildWornMonthSections(wearHistory),
    [wearHistory],
  );

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const totalDays = sections.reduce((sum, section) => sum + section.days.length, 0);

  const [expandedKey, setExpandedKey] = useState<string | null>(() => {
    if (sections[0]?.days.some((day) => day.key === todayKey)) return todayKey;
    return sections[0]?.days[0]?.key ?? null;
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Wear log' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
          <Text variant="caption" color={colors.primary}>
            Only days you logged
          </Text>
          <Text variant="title">Wear log</Text>
          <Text variant="body" color={colors.muted}>
            Compact history of what you wore, through today. Tap a day to
            expand.
          </Text>
          <Text variant="caption" color={colors.muted}>
            {totalDays} day{totalDays === 1 ? '' : 's'} · {wearHistory.length}{' '}
            wear{wearHistory.length === 1 ? '' : 's'}
          </Text>
        </Animated.View>

        {sections.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="subtitle">No looks yet</Text>
            <Text variant="body" color={colors.muted}>
              Mark an outfit or item as worn and it will show up here.
            </Text>
            <Button
              label="Go to Today"
              onPress={() => router.push('/(tabs)/today')}
            />
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text variant="subtitle">{section.label}</Text>
              <View style={styles.dayList}>
                {section.days.map((day, index) => (
                  <DayRow
                    key={day.key}
                    day={day}
                    index={index}
                    expanded={expandedKey === day.key}
                    onToggle={() =>
                      setExpandedKey((current) =>
                        current === day.key ? null : day.key,
                      )
                    }
                    itemsById={itemsById}
                    getItemsByIds={getItemsByIds}
                  />
                ))}
              </View>
            </View>
          ))
        )}
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
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  empty: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  dayList: {
    gap: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dayRowExpanded: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMist,
  },
  dayDateCol: {
    width: 48,
    alignItems: 'center',
    gap: 2,
  },
  dayBody: {
    flex: 1,
    gap: 6,
  },
  dayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayThumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  expandedList: {
    marginTop: spacing.sm,
    marginLeft: 48 + spacing.md,
    gap: spacing.sm,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  entryMosaic: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceMuted,
  },
  entryTile: {
    width: '50%',
    height: '50%',
  },
  entryTileEmpty: {
    width: '100%',
    height: '100%',
  },
  entryMeta: {
    flex: 1,
    gap: 2,
  },
});
