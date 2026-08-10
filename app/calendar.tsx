import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import type { ClothingItem, WearHistoryEntry } from '@/data/types';
import {
  buildMonthModels,
  formatDayHeading,
  monthStreakLabel,
  previewItemsForDay,
  toDayKey,
  weekdayLabels,
  type MonthModel,
} from '@/lib/wearCalendar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PAD = spacing.lg;
const CELL = (SCREEN_WIDTH - H_PAD * 2) / 7;
const MONTH_BLOCK_ESTIMATE = 420;

function DayCell({
  day,
  selected,
  previewUris,
  onPress,
}: {
  day: MonthModel['days'][number];
  selected: boolean;
  previewUris: string[];
  onPress: () => void;
}) {
  const hasLooks = day.entries.length > 0;
  const muted = !day.inMonth;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        selected && styles.cellSelected,
        day.isToday && !selected && styles.cellToday,
      ]}
    >
      <Text
        variant="caption"
        color={
          selected
            ? colors.white
            : muted
              ? colors.borderStrong
              : day.isToday
                ? colors.primary
                : colors.ink
        }
        style={styles.cellDayNum}
      >
        {day.day}
      </Text>
      {hasLooks ? (
        previewUris.length > 0 ? (
          <View style={styles.cellThumbs}>
            {previewUris.slice(0, 2).map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={[
                  styles.cellThumb,
                  selected && styles.cellThumbSelected,
                ]}
                contentFit="cover"
              />
            ))}
          </View>
        ) : (
          <View
            style={[styles.dot, selected && { backgroundColor: colors.white }]}
          />
        )
      ) : (
        <View style={styles.cellThumbSpacer} />
      )}
      {day.entries.length > 1 ? (
        <Text
          variant="caption"
          color={selected ? colors.white : colors.muted}
          style={styles.cellCount}
        >
          {day.entries.length}
        </Text>
      ) : null}
    </Pressable>
  );
}

function MonthBlock({
  model,
  selectedKey,
  onSelectDay,
  itemsById,
}: {
  model: MonthModel;
  selectedKey: string;
  onSelectDay: (key: string) => void;
  itemsById: Map<string, ClothingItem>;
}) {
  return (
    <View style={styles.monthBlock}>
      <View style={styles.monthHeader}>
        <Text variant="subtitle">{model.label}</Text>
        <Text variant="caption" color={colors.muted}>
          {monthStreakLabel(model)}
        </Text>
      </View>
      <View style={styles.weekRow}>
        {weekdayLabels().map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text variant="caption" color={colors.muted}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {model.days.map((day) => {
          const preview = previewItemsForDay(day.entries, itemsById, 2).map(
            (item) => item.imageUri,
          );
          return (
            <DayCell
              key={`${model.id}-${day.key}-${day.inMonth ? 'in' : 'out'}`}
              day={day}
              selected={selectedKey === day.key}
              previewUris={preview}
              onPress={() => onSelectDay(day.key)}
            />
          );
        })}
      </View>
    </View>
  );
}

function WearEntryCard({
  entry,
  index,
  getItemsByIds,
}: {
  entry: WearHistoryEntry;
  index: number;
  getItemsByIds: (ids: string[]) => { id: string; imageUri: string; name: string }[];
}) {
  const pieces = getItemsByIds(entry.itemIds);
  const isItem =
    entry.source === 'item' || (!entry.outfitId && entry.itemIds.length === 1);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(320)}>
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
    </Animated.View>
  );
}

export default function WearCalendarScreen() {
  const { wearHistory, items, getItemsByIds } = useApp();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MonthModel>>(null);
  const todayKey = toDayKey(new Date());

  const months = useMemo(
    () => buildMonthModels(wearHistory, { monthsBack: 8, monthsForward: 1 }),
    [wearHistory],
  );
  const currentIndex = useMemo(() => {
    const idx = months.findIndex((m) => {
      const [y, mo] = m.id.split('-').map(Number);
      const now = new Date();
      return y === now.getFullYear() && (mo ?? 1) - 1 === now.getMonth();
    });
    return idx >= 0 ? idx : months.length - 2;
  }, [months]);

  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [visibleMonthId, setVisibleMonthId] = useState(
    months[currentIndex]?.id ?? '',
  );

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const selectedEntries = useMemo(() => {
    return wearHistory
      .filter((entry) => toDayKey(entry.wornAt) === selectedKey)
      .sort(
        (a, b) => new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime(),
      );
  }, [wearHistory, selectedKey]);

  const visibleMonth = months.find((m) => m.id === visibleMonthId);

  useEffect(() => {
    // Ensure selection starts on today (or nearest worn day in current month).
    setSelectedKey(todayKey);
  }, [todayKey]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]?.item as MonthModel | undefined;
      if (first?.id) setVisibleMonthId(first.id);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
  }).current;

  const jumpToToday = () => {
    setSelectedKey(todayKey);
    listRef.current?.scrollToIndex({
      index: currentIndex,
      animated: true,
      viewPosition: 0,
    });
  };

  const onScrollToIndexFailed = (info: {
    index: number;
    averageItemLength: number;
  }) => {
    listRef.current?.scrollToOffset({
      offset: info.index * MONTH_BLOCK_ESTIMATE,
      animated: true,
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Wear calendar' }} />
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <Animated.View entering={FadeIn.duration(350)} style={styles.topBar}>
          <View style={styles.topBarText}>
            <Text variant="caption" color={colors.primary}>
              Your looks over time
            </Text>
            <Text variant="title">
              {visibleMonth?.label ?? 'Wear calendar'}
            </Text>
            <Text variant="caption" color={colors.muted}>
              Scroll months · tap a day to see what you wore
            </Text>
          </View>
          <Pressable style={styles.todayChip} onPress={jumpToToday}>
            <Text variant="caption" color={colors.primary}>
              Today
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendSwatch} />
            <Text variant="caption" color={colors.muted}>
              Days with looks
            </Text>
          </View>
          <Text variant="caption" color={colors.muted}>
            {wearHistory.length} logged wear
            {wearHistory.length === 1 ? '' : 's'}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={months}
          keyExtractor={(item) => item.id}
          initialScrollIndex={currentIndex}
          getItemLayout={(_, index) => ({
            length: MONTH_BLOCK_ESTIMATE,
            offset: MONTH_BLOCK_ESTIMATE * index,
            index,
          })}
          onScrollToIndexFailed={onScrollToIndexFailed}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MonthBlock
              model={item}
              selectedKey={selectedKey}
              onSelectDay={setSelectedKey}
              itemsById={itemsById}
            />
          )}
        />

        <View style={styles.detailPanel}>
          <Text variant="subtitle">{formatDayHeading(selectedKey)}</Text>
          {selectedKey === todayKey ? (
            <Text variant="caption" color={colors.primary}>
              Today
            </Text>
          ) : null}

          {selectedEntries.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text variant="body" color={colors.muted}>
                {selectedKey > todayKey
                  ? 'That day hasn’t happened yet.'
                  : 'Nothing logged this day. Mark an outfit or item as worn to fill your calendar.'}
              </Text>
              {selectedKey === todayKey ? (
                <Button
                  label="Suggest an outfit"
                  onPress={() => router.push('/(tabs)/today')}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.entryList}>
              {selectedEntries.map((entry, index) => (
                <WearEntryCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  getItemsByIds={getItemsByIds}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  topBarText: {
    flex: 1,
    gap: 2,
  },
  todayChip: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  legend: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  monthBlock: {
    minHeight: MONTH_BLOCK_ESTIMATE - 16,
    paddingHorizontal: H_PAD,
    marginBottom: spacing.md,
  },
  monthHeader: {
    gap: 2,
    marginBottom: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    width: CELL,
    alignItems: 'center',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  cell: {
    width: CELL,
    minHeight: 58,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 6,
    gap: 2,
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
  },
  cellToday: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
  },
  cellDayNum: {
    textAlign: 'center',
  },
  cellThumbs: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  cellThumb: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
  },
  cellThumbSelected: {
    borderWidth: 1,
    borderColor: colors.white,
  },
  cellThumbSpacer: {
    height: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  cellCount: {
    fontSize: 10,
    lineHeight: 12,
  },
  detailPanel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: 280,
    gap: spacing.sm,
  },
  emptyDay: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  entryList: {
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
    width: 56,
    height: 56,
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
    backgroundColor: colors.surfaceMuted,
  },
  entryMeta: {
    flex: 1,
    gap: 2,
  },
});
