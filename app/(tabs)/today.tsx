import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { OutfitAvatar } from '@/components/avatar/OutfitAvatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import type { ClothingItem, StylistSuggestion } from '@/data/types';
import {
  diagnoseWardrobeGaps,
  suggestOutfitsForToday,
} from '@/lib/stylist';
import { getTodayOnboarding } from '@/lib/todayOnboarding';
import {
  buildInspirationCards,
  likedVibeLabels,
  loadDiscoveryLikes,
} from '@/lib/discovery';
import {
  formatWeatherSummary,
  loadWeatherForToday,
  type WeatherSnapshot,
} from '@/lib/weather';

const OCCASIONS = ['Casual', 'Work', 'Brunch', 'Evening', 'Travel'];

function comboKey(ids: string[]) {
  return ids.slice().sort().join('|');
}

function formatTodayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function PieceStrip({ pieces }: { pieces: ClothingItem[] }) {
  if (!pieces.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pieceStrip}
    >
      {pieces.map((item) => (
        <Pressable
          key={item.id}
          style={styles.pieceChip}
          onPress={() => router.push(`/item/${item.id}`)}
        >
          <Image
            source={{ uri: item.imageUri }}
            style={styles.pieceThumb}
            contentFit="cover"
          />
          <Text variant="caption" numberOfLines={1} style={styles.pieceName}>
            {item.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function TodayScreen() {
  const {
    user,
    items,
    outfits,
    wearHistory,
    markOutfitWorn,
    getItemsByIds,
  } = useApp();

  const [occasion, setOccasion] = useState('Casual');
  const [suggestions, setSuggestions] = useState<StylistSuggestion[] | null>(
    null,
  );
  const [excludeKeys, setExcludeKeys] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [justWornId, setJustWornId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [likedLabels, setLikedLabels] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const likes = await loadDiscoveryLikes();
      setLikedLabels(likedVibeLabels(likes, buildInspirationCards()));
    })();
  }, []);

  const onboarding = useMemo(
    () => getTodayOnboarding(items, occasion),
    [items, occasion],
  );

  const generate = useCallback(
    (opts?: { excludeKeys?: string[] }) => {
      if (!onboarding.canSuggest) {
        setSuggestions([]);
        return;
      }
      const next = suggestOutfitsForToday({
        occasion,
        items,
        outfits,
        wearHistory,
        stylePreferences: [
          ...(user?.stylePreferences ?? []),
          ...likedLabels,
        ],
        weather,
        limit: 3,
        excludeKeys: opts?.excludeKeys ?? excludeKeys,
      });
      setSuggestions(next);
    },
    [
      onboarding.canSuggest,
      occasion,
      items,
      outfits,
      wearHistory,
      user?.stylePreferences,
      likedLabels,
      weather,
      excludeKeys,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWeatherLoading(true);
      const next = await loadWeatherForToday();
      if (!cancelled) {
        setWeather(next);
        setWeatherLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-generate when ready — no “Suggest” gate.
  useEffect(() => {
    if (weatherLoading) return;
    if (!onboarding.canSuggest) {
      setSuggestions(null);
      return;
    }
    generate({ excludeKeys: [] });
    setExcludeKeys([]);
    setJustWornId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate on closet/occasion/weather readiness
  }, [
    weatherLoading,
    onboarding.canSuggest,
    occasion,
    items.length,
    outfits.length,
  ]);

  const recentHistory = useMemo(
    () =>
      [...wearHistory].sort(
        (a, b) => new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime(),
      ),
    [wearHistory],
  );

  const primary = suggestions?.[0] ?? null;
  const alternates = suggestions?.slice(1, 3) ?? [];
  const primaryPieces = primary ? getItemsByIds(primary.itemIds) : [];

  const onNotFeelingIt = () => {
    if (!suggestions?.length) return;
    const rejected = suggestions.map((s) => comboKey(s.itemIds));
    const nextExclude = [...excludeKeys, ...rejected];
    setExcludeKeys(nextExclude);
    setJustWornId(null);
    generate({ excludeKeys: nextExclude });
  };

  const wearSuggestion = async (suggestion: StylistSuggestion) => {
    setBusyId(`wear-${suggestion.id}`);
    try {
      if (suggestion.sourceOutfitId) {
        await markOutfitWorn(suggestion.sourceOutfitId);
      } else {
        const now = new Date().toISOString();
        const outfit = {
          id: `outfit-${Date.now()}`,
          name: suggestion.title,
          occasion: suggestion.occasion,
          itemIds: suggestion.itemIds,
          createdAt: now,
          updatedAt: now,
        };
        await markOutfitWorn(outfit.id, outfit);
      }
      setJustWornId(suggestion.id);
    } finally {
      setBusyId(null);
    }
  };

  const promoteAlternate = (suggestion: StylistSuggestion) => {
    if (!suggestions) return;
    const rest = suggestions.filter((s) => s.id !== suggestion.id);
    setSuggestions([suggestion, ...rest].slice(0, 3));
    setJustWornId(null);
  };

  const showSetup = onboarding.status !== 'ready';
  const emptySuggestHint = diagnoseWardrobeGaps({ occasion, items });
  const dateLabel = formatTodayLabel();

  return (
    <Screen padded={false} scroll>
      <View style={styles.header}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text variant="caption" color={colors.muted}>
            {dateLabel}
          </Text>
          <Text variant="hero">Today</Text>
        </Animated.View>
        <Text variant="body" color={colors.muted}>
          {onboarding.status === 'empty'
            ? 'Build a small closet first — then ask what to wear.'
            : onboarding.status === 'building' && !onboarding.canSuggest
              ? onboarding.body
              : 'What should I wear? One look, two backups — tap Wear This when it clicks.'}
        </Text>
        <Pressable
          style={styles.calendarLink}
          onPress={() => router.push('/calendar')}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary}>
            This week
          </Text>
        </Pressable>
      </View>

      <Animated.View
        entering={FadeInDown.delay(40).duration(400)}
        style={styles.contextCard}
      >
        {weatherLoading ? (
          <View style={styles.weatherRow}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="body" color={colors.muted}>
              Checking local weather…
            </Text>
          </View>
        ) : weather ? (
          <View style={styles.weatherRow}>
            <View style={styles.weatherIcon}>
              <Ionicons
                name={
                  weather.isRainy
                    ? 'rainy-outline'
                    : weather.band === 'hot' || weather.band === 'warm'
                      ? 'sunny-outline'
                      : weather.band === 'cold' || weather.band === 'cool'
                        ? 'snow-outline'
                        : 'partly-sunny-outline'
                }
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.weatherMeta}>
              <Text variant="bodyMedium">
                {weather.city || 'Nearby'} · {formatWeatherSummary(weather)}
              </Text>
              <Text variant="caption" color={colors.muted}>
                {weather.source === 'live'
                  ? 'Live weather shapes today’s picks.'
                  : 'Mild default — allow location for live weather.'}
              </Text>
            </View>
          </View>
        ) : null}
      </Animated.View>

      {showSetup ? (
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={styles.setupCard}
        >
          <Text variant="subtitle">{onboarding.headline}</Text>
          <Text variant="body" color={colors.muted}>
            {onboarding.status === 'empty'
              ? onboarding.body
              : `${onboarding.pieceCount} piece${onboarding.pieceCount === 1 ? '' : 's'} in your closet.`}
          </Text>
          <View style={styles.checklist}>
            {onboarding.steps.map((step) => (
              <View key={step.id} style={styles.checkRow}>
                <Ionicons
                  name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={step.done ? colors.primary : colors.muted}
                />
                <Text
                  variant="body"
                  color={step.done ? colors.ink : colors.muted}
                  style={styles.checkLabel}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
          <Button
            label={
              onboarding.status === 'empty'
                ? 'Add your first piece'
                : 'Add more pieces'
            }
            onPress={() => router.push('/(tabs)/add')}
          />
        </Animated.View>
      ) : null}

      <View style={styles.section}>
        <Text variant="caption" color={colors.muted}>
          Vibe for today
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {OCCASIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={occasion === option}
              onPress={() => setOccasion(option)}
            />
          ))}
        </ScrollView>
      </View>

      {weatherLoading && onboarding.canSuggest ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="body" color={colors.muted}>
            Putting a look together…
          </Text>
        </View>
      ) : null}

      {!weatherLoading && onboarding.canSuggest && suggestions ? (
        <View style={styles.section}>
          {suggestions.length === 0 ? (
            <View style={styles.emptySuggest}>
              <Text variant="bodyMedium">Need a few more pieces</Text>
              <Text variant="body" color={colors.muted}>
                {emptySuggestHint.message}
              </Text>
              <Button
                label="Add to closet"
                onPress={() => router.push('/(tabs)/add')}
                style={styles.emptyBtn}
              />
              {excludeKeys.length ? (
                <Button
                  label="Reset vibes"
                  variant="ghost"
                  onPress={() => {
                    setExcludeKeys([]);
                    generate({ excludeKeys: [] });
                  }}
                />
              ) : null}
            </View>
          ) : primary ? (
            <>
              <Animated.View
                entering={FadeInDown.duration(420)}
                style={styles.primaryCard}
              >
                <OutfitAvatar
                  pieces={primaryPieces}
                  avatarUri={user?.avatarUri}
                  heightCm={user?.heightCm}
                />
                <View style={styles.avatarHint}>
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text variant="caption" color={colors.primary}>
                    Try-on preview · layered on your avatar
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <Text variant="caption" color={colors.primary}>
                    Today’s pick · {primary.occasion}
                    {primary.sourceOutfitId ? ' · Saved look' : ''}
                  </Text>
                  <Text variant="subtitle">{primary.title}</Text>
                  <Text variant="body" color={colors.muted}>
                    {primary.reason}
                  </Text>
                  <PieceStrip pieces={primaryPieces} />
                  <View style={styles.primaryActions}>
                    <Button
                      label={
                        busyId === `wear-${primary.id}`
                          ? 'Logging…'
                          : justWornId === primary.id
                            ? 'Logged for today'
                            : 'Wear This'
                      }
                      onPress={() => wearSuggestion(primary)}
                      disabled={Boolean(busyId) || justWornId === primary.id}
                    />
                    <Button
                      label="Not feeling it"
                      variant="secondary"
                      onPress={onNotFeelingIt}
                      disabled={Boolean(busyId)}
                    />
                  </View>
                </View>
              </Animated.View>

              {alternates.length ? (
                <View style={styles.altsBlock}>
                  <Text variant="caption" color={colors.muted}>
                    Or switch the vibe
                  </Text>
                  {alternates.map((alt, index) => {
                    const pieces = getItemsByIds(alt.itemIds);
                    return (
                      <Animated.View
                        key={alt.id}
                        entering={FadeInDown.delay(80 + index * 60)
                          .springify()
                          .damping(18)}
                        style={styles.altCard}
                      >
                        <Pressable
                          style={styles.altRow}
                          onPress={() => promoteAlternate(alt)}
                        >
                          <OutfitAvatar
                            pieces={pieces}
                            avatarUri={user?.avatarUri}
                            heightCm={user?.heightCm}
                            compact
                            style={styles.altAvatar}
                          />
                          <View style={styles.altMeta}>
                            <Text variant="bodyMedium" numberOfLines={1}>
                              {alt.title}
                            </Text>
                            <Text
                              variant="caption"
                              color={colors.muted}
                              numberOfLines={2}
                            >
                              {alt.reason}
                            </Text>
                            <Text variant="caption" color={colors.primary}>
                              Make this today’s pick
                            </Text>
                          </View>
                        </Pressable>
                        <View style={styles.altWearWrap}>
                          <Button
                            label={
                              busyId === `wear-${alt.id}`
                                ? 'Logging…'
                                : justWornId === alt.id
                                  ? 'Logged'
                                  : 'Wear This'
                            }
                            variant="ghost"
                            onPress={() => wearSuggestion(alt)}
                            disabled={Boolean(busyId) || justWornId === alt.id}
                          />
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.section, styles.historySection]}>
        <View style={styles.historyHeader}>
          <Text variant="subtitle">Recently worn</Text>
          <Text variant="caption" color={colors.muted}>
            One tap on Wear This logs the full look
          </Text>
        </View>

        {recentHistory.length === 0 ? (
          <Text variant="body" color={colors.muted}>
            {onboarding.status === 'empty'
              ? 'Once you add pieces and wear a look, it shows up here.'
              : 'Nothing worn yet — Wear This starts your habit loop.'}
          </Text>
        ) : (
          recentHistory.slice(0, 6).map((entry) => {
            const pieces = getItemsByIds(entry.itemIds).slice(0, 3);
            const isItemWear =
              entry.source === 'item' ||
              (!entry.outfitId && entry.itemIds.length === 1);
            return (
              <Pressable
                key={entry.id}
                style={styles.historyRow}
                onPress={() => {
                  if (isItemWear && entry.itemIds[0]) {
                    router.push(`/item/${entry.itemIds[0]}`);
                    return;
                  }
                  if (entry.outfitId) {
                    router.push(`/outfit/${entry.outfitId}`);
                  }
                }}
              >
                <View style={styles.historyThumbs}>
                  {pieces.map((item) => (
                    <Image
                      key={item.id}
                      source={{ uri: item.imageUri }}
                      style={styles.historyThumb}
                      contentFit="cover"
                    />
                  ))}
                </View>
                <View style={styles.historyMeta}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {entry.outfitName}
                  </Text>
                  <Text variant="caption" color={colors.muted}>
                    {isItemWear ? 'Item · ' : 'Outfit · '}
                    {entry.occasion ? `${entry.occasion} · ` : ''}
                    {new Date(entry.wornAt).toLocaleDateString()}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  calendarLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contextCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  weatherIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherMeta: {
    flex: 1,
    gap: 2,
  },
  setupCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  checklist: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkLabel: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  chipRow: {
    paddingRight: spacing.md,
    marginBottom: spacing.xs,
  },
  loadingBlock: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptySuggest: {
    gap: spacing.sm,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  emptyBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  primaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  altAvatar: {
    width: 96,
    flexShrink: 0,
  },
  avatarHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  cardBody: {
    padding: spacing.md,
    gap: 8,
  },
  pieceStrip: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pieceChip: {
    width: 72,
    gap: 4,
  },
  pieceThumb: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  pieceName: {
    color: colors.muted,
  },
  primaryActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  altsBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  altCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  altRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  altMeta: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: 4,
    justifyContent: 'center',
  },
  altWearWrap: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  historySection: {
    paddingBottom: spacing.xxl,
  },
  historyHeader: {
    gap: 2,
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  historyThumbs: {
    flexDirection: 'row',
  },
  historyThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    marginRight: -8,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surfaceMuted,
  },
  historyMeta: {
    flex: 1,
    gap: 2,
  },
});
