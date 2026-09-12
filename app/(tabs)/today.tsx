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
import type { StylistSuggestion } from '@/data/types';
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

function weatherIcon(weather: WeatherSnapshot) {
  if (weather.isRainy) return 'rainy-outline' as const;
  if (weather.band === 'hot' || weather.band === 'warm') return 'sunny-outline' as const;
  if (weather.band === 'cold' || weather.band === 'cool') return 'snow-outline' as const;
  return 'partly-sunny-outline' as const;
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
  const [busy, setBusy] = useState(false);
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
      [...wearHistory]
        .sort(
          (a, b) =>
            new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime(),
        )
        .slice(0, 3),
    [wearHistory],
  );

  const primary = suggestions?.[0] ?? null;
  const alternates = suggestions?.slice(1, 3) ?? [];
  const primaryPieces = primary ? getItemsByIds(primary.itemIds) : [];

  const onAnother = () => {
    if (!suggestions?.length) return;
    const rejected = suggestions.map((s) => comboKey(s.itemIds));
    const nextExclude = [...excludeKeys, ...rejected];
    setExcludeKeys(nextExclude);
    setJustWornId(null);
    generate({ excludeKeys: nextExclude });
  };

  const wearSuggestion = async (suggestion: StylistSuggestion) => {
    setBusy(true);
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
      setBusy(false);
    }
  };

  const promoteAlternate = (suggestion: StylistSuggestion) => {
    if (!suggestions) return;
    const rest = suggestions.filter((s) => s.id !== suggestion.id);
    setSuggestions([suggestion, ...rest].slice(0, 3));
    setJustWornId(null);
  };

  const showSetup = !onboarding.canSuggest;
  const emptySuggestHint = diagnoseWardrobeGaps({ occasion, items });
  const worn = primary ? justWornId === primary.id : false;

  return (
    <Screen padded={false} scroll>
      <View style={styles.header}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerCopy}>
          <Text variant="caption" color={colors.muted} style={styles.eyebrow}>
            {formatTodayLabel()}
          </Text>
          <Text variant="hero">Today</Text>
          <View style={styles.weatherLine}>
            {weatherLoading ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : weather ? (
              <>
                <Ionicons
                  name={weatherIcon(weather)}
                  size={16}
                  color={colors.accent}
                />
                <Text variant="caption" color={colors.inkSoft}>
                  {formatWeatherSummary(weather)}
                  {weather.city ? ` · ${weather.city}` : ''}
                </Text>
              </>
            ) : null}
          </View>
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="This week"
          onPress={() => router.push('/calendar')}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipList}
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

      {showSetup ? (
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={styles.card}
        >
          <Text variant="subtitle">{onboarding.headline}</Text>
          <Text variant="body" color={colors.muted}>
            {onboarding.body}
          </Text>
          <View style={styles.checklist}>
            {onboarding.steps.map((step) => (
              <View key={step.id} style={styles.checkRow}>
                <Ionicons
                  name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={step.done ? colors.primary : colors.muted}
                />
                <Text
                  variant="caption"
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

      {!showSetup && (weatherLoading || !suggestions) ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="caption" color={colors.muted}>
            Putting a look together…
          </Text>
        </View>
      ) : null}

      {!showSetup && !weatherLoading && suggestions ? (
        suggestions.length === 0 ? (
          <View style={styles.card}>
            <Text variant="subtitle">Need a few more pieces</Text>
            <Text variant="body" color={colors.muted}>
              {emptySuggestHint.message}
            </Text>
            <View style={styles.actionRow}>
              <Button
                label="Add to closet"
                onPress={() => router.push('/(tabs)/add')}
                style={styles.grow}
              />
              {excludeKeys.length ? (
                <Button
                  label="Start over"
                  variant="ghost"
                  onPress={() => {
                    setExcludeKeys([]);
                    generate({ excludeKeys: [] });
                  }}
                  style={styles.grow}
                />
              ) : null}
            </View>
          </View>
        ) : primary ? (
          <>
            <Animated.View
              key={primary.id}
              entering={FadeInDown.duration(380)}
              style={styles.heroCard}
            >
              <View style={styles.heroRow}>
                <OutfitAvatar
                  pieces={primaryPieces}
                  avatarUri={user?.avatarUri}
                  heightCm={user?.heightCm}
                  style={styles.heroAvatar}
                />
                <View style={styles.heroMeta}>
                  <View style={styles.tag}>
                    <Ionicons name="sparkles" size={12} color={colors.accent} />
                    <Text variant="caption" color={colors.accent}>
                      {primary.sourceOutfitId ? 'Saved look' : 'Today’s pick'}
                    </Text>
                  </View>
                  <Text variant="subtitle">{primary.title}</Text>
                  <Text
                    variant="caption"
                    color={colors.muted}
                    numberOfLines={3}
                    style={styles.reason}
                  >
                    {primary.reason}
                  </Text>
                  <View style={styles.pieceRow}>
                    {primaryPieces.slice(0, 4).map((item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={item.name}
                        onPress={() => router.push(`/item/${item.id}`)}
                      >
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.pieceThumb}
                          contentFit="cover"
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.actionRow}>
                <Button
                  label={busy ? 'Logging…' : worn ? 'Worn today ✓' : 'Wear this'}
                  onPress={() => wearSuggestion(primary)}
                  disabled={busy || worn}
                  style={styles.grow}
                />
                <Button
                  label="Another"
                  variant="ghost"
                  onPress={onAnother}
                  disabled={busy}
                  style={styles.another}
                />
              </View>
            </Animated.View>

            {alternates.length ? (
              <View style={styles.section}>
                <Text variant="caption" color={colors.muted}>
                  Backups · tap to swap
                </Text>
                <View style={styles.altRow}>
                  {alternates.map((alt, index) => {
                    const pieces = getItemsByIds(alt.itemIds);
                    return (
                      <Animated.View
                        key={alt.id}
                        entering={FadeInDown.delay(80 + index * 60).duration(360)}
                        style={styles.grow}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Make ${alt.title} today’s pick`}
                          style={styles.altCard}
                          onPress={() => promoteAlternate(alt)}
                        >
                          <OutfitAvatar
                            pieces={pieces}
                            avatarUri={user?.avatarUri}
                            heightCm={user?.heightCm}
                            compact
                            style={styles.altAvatar}
                          />
                          <Text
                            variant="caption"
                            numberOfLines={1}
                            style={styles.altTitle}
                          >
                            {alt.title}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        ) : null
      ) : null}

      {recentHistory.length ? (
        <View style={[styles.section, styles.historySection]}>
          <View style={styles.historyHeader}>
            <Text variant="caption" color={colors.muted}>
              Recently worn
            </Text>
            <Pressable
              onPress={() => router.push('/calendar')}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text variant="caption" color={colors.primary}>
                See all
              </Text>
            </Pressable>
          </View>
          {recentHistory.map((entry) => {
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
                    {new Date(entry.wornAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {entry.occasion ? ` · ${entry.occasion}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  weatherLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 20,
    marginTop: 2,
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
    marginTop: spacing.xs,
  },
  chipList: {
    flexGrow: 0,
    marginTop: spacing.md,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
    paddingVertical: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  checklist: {
    gap: 6,
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
  loadingBlock: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroAvatar: {
    width: 148,
    flexShrink: 0,
  },
  heroMeta: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reason: {
    lineHeight: 18,
  },
  pieceRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  pieceThumb: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  grow: {
    flex: 1,
  },
  another: {
    flex: 0,
    minWidth: 112,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  altRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  altCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  altAvatar: {
    width: '100%',
    aspectRatio: 1.1,
  },
  altTitle: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  historySection: {
    paddingBottom: spacing.xxl,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingRight: spacing.md,
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
