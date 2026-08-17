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
  buildEarlierMonthSections,
  buildThisWeek,
  formatDayHeading,
  previewItemsForDay,
  toDayKey,
  type WeekDay,
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
          <Pressable
            style={styles.addLookLink}
            onPress={() =>
              router.push({
                pathname: '/log-wear',
                params: { day: day.key },
              })
            }
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text variant="caption" color={colors.primary}>
              Add another look
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

function WeekDayCell({
  day,
  selected,
  onPress,
  itemsById,
}: {
  day: WeekDay;
  selected: boolean;
  onPress: () => void;
  itemsById: Map<string, ClothingItem>;
}) {
  const thumb = previewItemsForDay(day.entries, itemsById, 1)[0];
  const hasLooks = day.entries.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: day.isFuture }}
      accessibilityLabel={`${day.label}${hasLooks ? `, ${day.entries.length} looks` : day.isFuture ? ', upcoming' : ', nothing logged'}`}
      disabled={day.isFuture}
      onPress={onPress}
      style={[
        styles.weekCell,
        day.isToday && styles.weekCellToday,
        selected && styles.weekCellSelected,
        day.isFuture && styles.weekCellFuture,
      ]}
    >
      <Text
        variant="caption"
        color={
          day.isFuture
            ? colors.borderStrong
            : day.isToday || selected
              ? colors.primary
              : colors.muted
        }
      >
        {day.weekdayShort}
      </Text>
      <Text
        variant="bodyMedium"
        color={
          day.isFuture
            ? colors.borderStrong
            : day.isToday || selected
              ? colors.primary
              : colors.ink
        }
      >
        {Number(day.key.slice(-2))}
      </Text>
      {hasLooks && thumb ? (
        <Image
          source={{ uri: thumb.imageUri }}
          style={styles.weekThumb}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.weekDot,
            hasLooks && styles.weekDotFilled,
            day.isFuture && styles.weekDotFuture,
          ]}
        />
      )}
    </Pressable>
  );
}

export default function WearCalendarScreen() {
  const { wearHistory, items, getItemsByIds } = useApp();
  const insets = useSafeAreaInsets();
  const todayKey = toDayKey(new Date());

  const week = useMemo(() => buildThisWeek(wearHistory), [wearHistory]);
  const earlierSections = useMemo(
    () => buildEarlierMonthSections(wearHistory),
    [wearHistory],
  );

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const today = week.days.find((day) => day.key === todayKey);
    if (today) return todayKey;
    const lastWorn = [...week.days]
      .reverse()
      .find((day) => !day.isFuture && day.entries.length > 0);
    return lastWorn?.key ?? todayKey;
  });

  const [expandedEarlierKey, setExpandedEarlierKey] = useState<string | null>(
    null,
  );

  const selectedDay =
    week.days.find((day) => day.key === selectedKey) ??
    week.days.find((day) => day.key === todayKey);

  const onSelectDay = (day: WeekDay) => {
    if (day.isFuture) return;
    setSelectedKey(day.key);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'This week' }} />
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
            {week.rangeLabel}
          </Text>
          <Text variant="title">This week</Text>
          <Text variant="body" color={colors.muted}>
            What you wore Mon–Sun. Tap a day to review or log a forgotten look.
          </Text>
          <Text variant="caption" color={colors.muted}>
            {week.wornDayCount} of {week.days.filter((d) => !d.isFuture).length}{' '}
            days logged · {week.wearCount} wear
            {week.wearCount === 1 ? '' : 's'}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(60).duration(350)}
          style={styles.weekStrip}
        >
          {week.days.map((day) => (
            <WeekDayCell
              key={day.key}
              day={day}
              selected={selectedKey === day.key}
              onPress={() => onSelectDay(day)}
              itemsById={itemsById}
            />
          ))}
        </Animated.View>

        {selectedDay ? (
          <View style={styles.selectedPanel}>
            <View style={styles.selectedHead}>
              <View style={styles.selectedHeadText}>
                <Text variant="subtitle">
                  {selectedDay.isToday ? 'Today' : selectedDay.weekdayShort}
                </Text>
                <Text variant="caption" color={colors.muted}>
                  {formatDayHeading(selectedDay.key)}
                </Text>
              </View>
              {!selectedDay.isFuture ? (
                <Pressable
                  style={styles.logChip}
                  onPress={() =>
                    router.push({
                      pathname: '/log-wear',
                      params: { day: selectedDay.key },
                    })
                  }
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text variant="caption" color={colors.primary}>
                    Log look
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {selectedDay.entries.length === 0 ? (
              <View style={styles.emptyDay}>
                <Text variant="bodyMedium">Nothing logged</Text>
                <Text variant="body" color={colors.muted}>
                  {selectedDay.isToday
                    ? 'Wear something from Today, or log a look you already wore.'
                    : 'Forgot to log? Add what you wore this day.'}
                </Text>
                <Button
                  label="Log a look"
                  onPress={() =>
                    router.push({
                      pathname: '/log-wear',
                      params: { day: selectedDay.key },
                    })
                  }
                />
                {selectedDay.isToday ? (
                  <Button
                    label="Suggest outfits"
                    variant="ghost"
                    onPress={() => router.push('/(tabs)/today')}
                  />
                ) : null}
              </View>
            ) : (
              <View style={styles.entryList}>
                {selectedDay.entries.map((entry) => (
                  <WearEntryCard
                    key={entry.id}
                    entry={entry}
                    getItemsByIds={getItemsByIds}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {earlierSections.length > 0 ? (
          <View style={styles.earlier}>
            <Text variant="subtitle">Earlier</Text>
            <Text variant="caption" color={colors.muted}>
              Looks from before this week
            </Text>
            {earlierSections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text variant="caption" color={colors.muted}>
                  {section.label}
                </Text>
                <View style={styles.dayList}>
                  {section.days.map((day, index) => (
                    <DayRow
                      key={day.key}
                      day={day}
                      index={index}
                      expanded={expandedEarlierKey === day.key}
                      onToggle={() =>
                        setExpandedEarlierKey((current) =>
                          current === day.key ? null : day.key,
                        )
                      }
                      itemsById={itemsById}
                      getItemsByIds={getItemsByIds}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : wearHistory.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="subtitle">No looks yet</Text>
            <Text variant="body" color={colors.muted}>
              Log something you wore today — your week strip will start to fill
              in.
            </Text>
            <Button
              label="Log a look"
              onPress={() => router.push('/log-wear')}
            />
            <Button
              label="Go to Today"
              variant="ghost"
              onPress={() => router.push('/(tabs)/today')}
            />
          </View>
        ) : null}
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
  weekStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
  },
  weekCellToday: {
    borderColor: colors.primary,
  },
  weekCellSelected: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.primary,
  },
  weekCellFuture: {
    opacity: 0.45,
  },
  weekThumb: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginTop: 2,
  },
  weekDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekDotFuture: {
    borderColor: colors.border,
  },
  selectedPanel: {
    gap: spacing.md,
  },
  selectedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectedHeadText: {
    flex: 1,
    gap: 2,
  },
  logChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyDay: {
    gap: spacing.sm,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  entryList: {
    gap: spacing.sm,
  },
  earlier: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
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
    marginTop: spacing.sm,
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
  addLookLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
});
