import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

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
  formatWeatherSummary,
  loadWeatherForToday,
  type WeatherSnapshot,
} from '@/lib/weather';

const OCCASIONS = ['Casual', 'Work', 'Brunch', 'Evening', 'Travel'];

export default function TodayScreen() {
  const {
    user,
    items,
    outfits,
    wearHistory,
    addOutfit,
    markOutfitWorn,
    getItemsByIds,
  } = useApp();

  const [occasion, setOccasion] = useState('Casual');
  const [suggestions, setSuggestions] = useState<StylistSuggestion[] | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const onboarding = useMemo(
    () => getTodayOnboarding(items, occasion),
    [items, occasion],
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

  // Clear stale suggestions when the closet changes a lot (e.g. first uploads).
  useEffect(() => {
    setSuggestions(null);
  }, [items.length]);

  const recentHistory = useMemo(
    () =>
      [...wearHistory].sort(
        (a, b) => new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime(),
      ),
    [wearHistory],
  );

  const generate = () => {
    if (!onboarding.canSuggest) return;
    const next = suggestOutfitsForToday({
      occasion,
      items,
      outfits,
      wearHistory,
      stylePreferences: user?.stylePreferences ?? [],
      weather,
      limit: 3,
    });
    setSuggestions(next);
  };

  const saveSuggestion = async (suggestion: StylistSuggestion) => {
    setBusyId(suggestion.id);
    try {
      if (suggestion.sourceOutfitId) {
        router.push(`/outfit/${suggestion.sourceOutfitId}`);
        return;
      }
      const now = new Date().toISOString();
      const id = `outfit-${Date.now()}`;
      await addOutfit({
        id,
        name: suggestion.title,
        occasion: suggestion.occasion,
        itemIds: suggestion.itemIds,
        createdAt: now,
        updatedAt: now,
      });
      router.push(`/outfit/${id}`);
    } finally {
      setBusyId(null);
    }
  };

  const wearSuggestion = async (suggestion: StylistSuggestion) => {
    setBusyId(`wear-${suggestion.id}`);
    try {
      const now = new Date().toISOString();
      if (suggestion.sourceOutfitId) {
        await markOutfitWorn(suggestion.sourceOutfitId);
      } else {
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
      generate();
    } finally {
      setBusyId(null);
    }
  };

  const tweakSuggestion = (suggestion: StylistSuggestion) => {
    router.push({
      pathname: '/outfit/tweak',
      params: {
        title: suggestion.title,
        occasion: suggestion.occasion,
        itemIds: suggestion.itemIds.join(','),
        ...(suggestion.sourceOutfitId
          ? { sourceOutfitId: suggestion.sourceOutfitId }
          : {}),
      },
    });
  };

  const showSetup = onboarding.status !== 'ready';
  const emptySuggestHint = diagnoseWardrobeGaps({ occasion, items });

  return (
    <Screen padded={false} scroll>
      <View style={styles.header}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text variant="caption" color={colors.muted}>
            AI stylist · weather-aware
          </Text>
          <Text variant="hero">Today</Text>
        </Animated.View>
        <Text variant="body" color={colors.muted}>
          {onboarding.status === 'empty'
            ? 'Build a small closet first — then ask what to wear.'
            : onboarding.status === 'building'
              ? onboarding.body
              : 'What should I wear? Suggestions use your wardrobe, preferences, and today’s weather.'}
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

      {showSetup ? (
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={styles.setupCard}
        >
          <Text variant="subtitle">{onboarding.headline}</Text>
          <Text variant="body" color={colors.muted}>
            {onboarding.status === 'empty'
              ? onboarding.body
              : `${onboarding.pieceCount} piece${onboarding.pieceCount === 1 ? '' : 's'} in your wardrobe.`}
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
          {onboarding.canSuggest ? (
            <Text variant="caption" color={colors.muted}>
              Or pick an occasion below and try Suggest outfits.
            </Text>
          ) : null}
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(80).duration(400)}
        style={styles.weatherCard}
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
                  ? 'Live via Open-Meteo — outfits will favor pieces that fit this.'
                  : 'Using a mild default — allow location for live weather.'}
              </Text>
            </View>
          </View>
        ) : null}
      </Animated.View>

      <View style={styles.section}>
        <Text variant="caption" color={colors.muted}>
          Occasion
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
              onPress={() => {
                setOccasion(option);
                setSuggestions(null);
              }}
            />
          ))}
        </ScrollView>
        <Button
          label={
            weatherLoading
              ? 'Loading weather…'
              : !onboarding.canSuggest
                ? 'Add pieces to unlock suggestions'
                : suggestions
                  ? 'Suggest again'
                  : 'Suggest outfits'
          }
          onPress={
            onboarding.canSuggest
              ? generate
              : () => router.push('/(tabs)/add')
          }
          disabled={weatherLoading && onboarding.canSuggest}
        />
      </View>

      {suggestions ? (
        <View style={styles.section}>
          <Text variant="subtitle">Suggestions</Text>
          {onboarding.varietyTip ? (
            <Text variant="caption" color={colors.muted}>
              {onboarding.varietyTip}
            </Text>
          ) : null}
          {suggestions.length === 0 ? (
            <View style={styles.emptySuggest}>
              <Text variant="bodyMedium">Need a few more pieces</Text>
              <Text variant="body" color={colors.muted}>
                {emptySuggestHint.message}
              </Text>
              {emptySuggestHint.missing.length ? (
                <Text variant="caption" color={colors.primary}>
                  Missing: {emptySuggestHint.missing.join(' · ')}
                </Text>
              ) : null}
              <Button
                label="Add to wardrobe"
                onPress={() => router.push('/(tabs)/add')}
                style={styles.emptyBtn}
              />
            </View>
          ) : (
            suggestions.map((suggestion, index) => {
              const pieces = getItemsByIds(suggestion.itemIds);
              return (
                <Animated.View
                  key={suggestion.id}
                  entering={FadeInDown.delay(index * 80).springify().damping(18)}
                  style={styles.card}
                >
                  <View style={styles.mosaic}>
                    {pieces.slice(0, 4).map((item) => (
                      <Image
                        key={item.id}
                        source={{ uri: item.imageUri }}
                        style={styles.tile}
                        contentFit="cover"
                      />
                    ))}
                  </View>
                  <View style={styles.cardBody}>
                    <Text variant="subtitle">{suggestion.title}</Text>
                    <Text variant="caption" color={colors.primary}>
                      {suggestion.occasion}
                      {suggestion.sourceOutfitId
                        ? ' · Saved outfit'
                        : ' · New combo'}
                    </Text>
                    <Text variant="body" color={colors.muted}>
                      {suggestion.reason}
                    </Text>
                    <View style={styles.cardActions}>
                      <Button
                        label={
                          busyId === suggestion.id
                            ? 'Opening…'
                            : suggestion.sourceOutfitId
                              ? 'Open outfit'
                              : 'Save outfit'
                        }
                        onPress={() => saveSuggestion(suggestion)}
                        disabled={Boolean(busyId)}
                        style={styles.cardBtn}
                      />
                      <Button
                        label={
                          busyId === `wear-${suggestion.id}`
                            ? 'Saving…'
                            : 'Wear today'
                        }
                        variant="secondary"
                        onPress={() => wearSuggestion(suggestion)}
                        disabled={Boolean(busyId)}
                        style={styles.cardBtn}
                      />
                    </View>
                    {!suggestion.sourceOutfitId ? (
                      <Button
                        label="Tweak look"
                        variant="ghost"
                        onPress={() => tweakSuggestion(suggestion)}
                        disabled={Boolean(busyId)}
                      />
                    ) : null}
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      ) : onboarding.status === 'ready' ? (
        <View style={styles.section}>
          <View style={styles.readyHint}>
            <Text variant="bodyMedium">Ready when you are</Text>
            <Text variant="body" color={colors.muted}>
              Pick an occasion, then tap Suggest outfits for looks from your
              closet.
            </Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.section, styles.historySection]}>
        <View style={styles.historyHeader}>
          <Text variant="subtitle">Wear history</Text>
          <Text variant="caption" color={colors.muted}>
            Recently worn looks
          </Text>
        </View>

        {recentHistory.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Text variant="body" color={colors.muted}>
              {onboarding.status === 'empty'
                ? 'Once you add pieces and wear a look, it shows up here.'
                : 'Nothing worn yet. Suggest a look, then tap Wear today.'}
            </Text>
          </View>
        ) : (
          recentHistory.slice(0, 8).map((entry) => {
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
  weatherCard: {
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
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  chipRow: {
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
  },
  readyHint: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  mosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 140,
    backgroundColor: colors.surfaceMuted,
  },
  tile: {
    width: '50%',
    height: '50%',
  },
  cardBody: {
    padding: spacing.md,
    gap: 6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  historySection: {
    paddingBottom: spacing.xxl,
  },
  historyHeader: {
    gap: 2,
    marginBottom: spacing.sm,
  },
  historyEmpty: {
    paddingVertical: spacing.xs,
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
