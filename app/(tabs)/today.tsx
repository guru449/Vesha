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
  type WardrobeGapHint,
} from '@/lib/stylist';
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
  const [gapHint, setGapHint] = useState<WardrobeGapHint | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

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

  const recentHistory = useMemo(
    () =>
      [...wearHistory].sort(
        (a, b) => new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime(),
      ),
    [wearHistory],
  );

  const generate = () => {
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
    setGapHint(
      next.length === 0
        ? diagnoseWardrobeGaps({ occasion, items })
        : null,
    );
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
          What should I wear? Suggestions use your wardrobe, preferences, and
          today’s weather.
        </Text>
        <Pressable
          style={styles.calendarLink}
          onPress={() => router.push('/calendar')}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary}>
            Open wear log
          </Text>
        </Pressable>
      </View>

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
                setGapHint(null);
              }}
            />
          ))}
        </ScrollView>
        <Button
          label={weatherLoading ? 'Loading weather…' : 'Suggest outfits'}
          onPress={generate}
          disabled={weatherLoading}
        />
      </View>

      {suggestions ? (
        <View style={styles.section}>
          <Text variant="subtitle">Suggestions</Text>
          {suggestions.length === 0 ? (
            <View style={styles.emptySuggest}>
              <Text variant="bodyMedium">Need a few more pieces</Text>
              <Text variant="body" color={colors.muted}>
                {gapHint?.message ||
                  'Not enough pieces yet. Add more items to your wardrobe.'}
              </Text>
              {gapHint?.missing.length ? (
                <Text variant="caption" color={colors.primary}>
                  Missing: {gapHint.missing.join(' · ')}
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
      ) : null}

      <View style={[styles.section, styles.historySection]}>
        <View style={styles.historyHeader}>
          <Text variant="subtitle">Wear history</Text>
          <Text variant="caption" color={colors.muted}>
            Recently worn looks
          </Text>
        </View>

        {recentHistory.length === 0 ? (
          <Text variant="body" color={colors.muted}>
            Nothing worn yet. Tap Wear today on a look to build history.
          </Text>
        ) : (
          recentHistory.slice(0, 8).map((entry) => {
            const pieces = getItemsByIds(entry.itemIds).slice(0, 3);
            const isItemWear =
              entry.source === 'item' || (!entry.outfitId && entry.itemIds.length === 1);
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
