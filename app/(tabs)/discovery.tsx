import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
import {
  buildForYouLooks,
  buildInspirationCards,
  closetVariantsForOccasion,
  filterByNlQuery,
  filterOccasions,
  filterTrends,
  likedVibeLabels,
  loadDiscoveryLikes,
  toggleDiscoveryLike,
  type DiscoveryInspirationCard,
  type DiscoveryLookCard,
} from '@/lib/discovery';
import { discoveryOccasions } from '@/data/discoveryContent';

type SectionFilter = 'all' | 'foryou' | 'occasions' | 'trends' | 'liked';

export default function DiscoveryScreen() {
  const {
    user,
    items,
    outfits,
    wearHistory,
    getItemsByIds,
    markOutfitWorn,
    addOutfit,
  } = useApp();

  const [query, setQuery] = useState('');
  const [section, setSection] = useState<SectionFilter>('all');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [activeOccasionId, setActiveOccasionId] = useState(
    discoveryOccasions[0]?.id ?? 'date-night',
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void loadDiscoveryLikes().then(setLikedIds);
  }, []);

  const inspirations = useMemo(() => buildInspirationCards(), []);
  const likedLabels = useMemo(
    () => likedVibeLabels(likedIds, inspirations),
    [likedIds, inspirations],
  );

  const forYou = useMemo(
    () =>
      buildForYouLooks({
        items,
        outfits,
        wearHistory,
        stylePreferences: user?.stylePreferences ?? [],
        likedLabels,
        limit: 6,
      }),
    [items, outfits, wearHistory, user?.stylePreferences, likedLabels],
  );

  const filteredForYou = useMemo(
    () =>
      filterByNlQuery(forYou, query, (row) => [
        row.title,
        row.subtitle,
        row.occasion,
        row.reason,
      ]),
    [forYou, query],
  );

  const occasions = useMemo(() => filterOccasions(query), [query]);
  const trends = useMemo(() => filterTrends(query), [query]);

  const activeOccasion =
    occasions.find((row) => row.id === activeOccasionId) ?? occasions[0];

  const occasionBundle = useMemo(() => {
    if (!activeOccasion) return null;
    return closetVariantsForOccasion({
      occasion: activeOccasion,
      items,
      outfits,
      wearHistory,
      stylePreferences: user?.stylePreferences ?? [],
      likedLabels,
    });
  }, [
    activeOccasion,
    items,
    outfits,
    wearHistory,
    user?.stylePreferences,
    likedLabels,
  ]);

  const likedCards = useMemo(
    () => inspirations.filter((card) => likedIds.includes(card.id)),
    [inspirations, likedIds],
  );

  const onToggleLike = useCallback(async (id: string) => {
    const next = await toggleDiscoveryLike(id);
    setLikedIds(next);
  }, []);

  const openVibeMatch = (fixtureId: string, imageUri?: string) => {
    router.push({
      pathname: '/vibe/result',
      params: {
        fixtureId,
        ...(imageUri ? { imageUri } : {}),
      },
    });
  };

  const wearLook = async (look: DiscoveryLookCard) => {
    setBusyId(look.id);
    try {
      const now = new Date().toISOString();
      if (look.sourceOutfitId) {
        await markOutfitWorn(look.sourceOutfitId);
      } else {
        await markOutfitWorn(`outfit-${Date.now()}`, {
          id: `outfit-${Date.now()}`,
          name: look.title,
          occasion: look.occasion,
          itemIds: look.itemIds,
          createdAt: now,
          updatedAt: now,
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const saveLook = async (look: DiscoveryLookCard) => {
    setBusyId(`save-${look.id}`);
    try {
      const now = new Date().toISOString();
      await addOutfit({
        id: `outfit-${Date.now()}`,
        name: look.title,
        occasion: look.occasion,
        itemIds: look.itemIds,
        createdAt: now,
        updatedAt: now,
      });
    } finally {
      setBusyId(null);
    }
  };

  const showForYou = section === 'all' || section === 'foryou';
  const showOccasions = section === 'all' || section === 'occasions';
  const showTrends = section === 'all' || section === 'trends';
  const showLiked = section === 'liked' || (section === 'all' && likedCards.length > 0);

  return (
    <Screen padded={false} scroll>
      <View style={styles.pad}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text variant="caption" color={colors.muted}>
            What could I wear?
          </Text>
          <Text variant="hero">Discovery</Text>
          <Text variant="body" color={colors.muted}>
            Looks from your closet, occasions, and trends — always a path back
            to Wear or Vibe Match.
          </Text>
        </Animated.View>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder='Try “date night” or “wedding”'
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {(
            [
              ['all', 'All'],
              ['foryou', 'For You'],
              ['occasions', 'Occasions'],
              ['trends', 'Trending'],
              ['liked', 'Liked'],
            ] as const
          ).map(([id, label]) => (
            <Chip
              key={id}
              label={label}
              selected={section === id}
              onPress={() => setSection(id)}
            />
          ))}
        </ScrollView>

        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialCard}
            onPress={() => router.push('/social')}
          >
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text variant="caption" color={colors.primary}>
              Community
            </Text>
          </Pressable>
          <Pressable
            style={styles.socialCard}
            onPress={() => router.push('/groups')}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
            <Text variant="caption" color={colors.primary}>
              Groups
            </Text>
          </Pressable>
        </View>
      </View>

      {showForYou ? (
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={styles.section}
        >
          <View style={styles.sectionHead}>
            <Text variant="subtitle">For You</Text>
            <Text variant="caption" color={colors.muted}>
              From your closet
            </Text>
          </View>
          {filteredForYou.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text variant="body" color={colors.muted}>
                {items.length < 3
                  ? 'Add a few more pieces and we’ll build looks here.'
                  : 'Nothing matches that search — try another vibe.'}
              </Text>
              <Button
                label="Open Closet"
                variant="secondary"
                onPress={() => router.push('/(tabs)/wardrobe')}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hRow}
            >
              {filteredForYou.map((look) => (
                <ClosetLookCard
                  key={look.id}
                  look={look}
                  pieces={getItemsByIds(look.itemIds)}
                  avatarUri={user?.avatarUri}
                  heightCm={user?.heightCm}
                  busy={busyId === look.id || busyId === `save-${look.id}`}
                  onWear={() => wearLook(look)}
                  onSave={() => saveLook(look)}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      ) : null}

      {showOccasions ? (
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <View style={[styles.sectionHead, styles.padX]}>
            <Text variant="subtitle">Occasions</Text>
            <Text variant="caption" color={colors.muted}>
              Inspiration + your versions
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRow}
          >
            {occasions.map((row) => (
              <Chip
                key={row.id}
                label={row.label}
                selected={activeOccasion?.id === row.id}
                onPress={() => setActiveOccasionId(row.id)}
              />
            ))}
          </ScrollView>
          {occasionBundle ? (
            <View style={styles.padX}>
              <InspirationCard
                card={occasionBundle.inspiration}
                liked={likedIds.includes(occasionBundle.inspiration.id)}
                onLike={() => onToggleLike(occasionBundle.inspiration.id)}
                onVibeMatch={() =>
                  openVibeMatch(
                    occasionBundle.inspiration.fixtureId,
                    occasionBundle.inspiration.imageUri,
                  )
                }
              />
              {occasionBundle.looks.length ? (
                <View style={styles.variantBlock}>
                  <Text variant="caption" color={colors.muted}>
                    Closet-feasible variants
                  </Text>
                  {occasionBundle.looks.map((look) => (
                    <Pressable
                      key={look.id}
                      style={styles.variantRow}
                      onPress={() => wearLook(look)}
                    >
                      <OutfitAvatar
                        pieces={getItemsByIds(look.itemIds)}
                        avatarUri={user?.avatarUri}
                        heightCm={user?.heightCm}
                        compact
                        style={styles.variantAvatar}
                      />
                      <View style={styles.variantMeta}>
                        <Text variant="bodyMedium" numberOfLines={1}>
                          {look.title}
                        </Text>
                        <Text variant="caption" color={colors.muted} numberOfLines={2}>
                          {look.reason}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.muted}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text variant="body" color={colors.muted}>
                  Not enough pieces for this occasion yet — Vibe Match still
                  works with silhouette hacks.
                </Text>
              )}
            </View>
          ) : (
            <Text variant="body" color={colors.muted} style={styles.padX}>
              No occasions match that search.
            </Text>
          )}
        </Animated.View>
      ) : null}

      {showTrends ? (
        <Animated.View
          entering={FadeInDown.delay(140).duration(400)}
          style={styles.section}
        >
          <View style={[styles.sectionHead, styles.padX]}>
            <Text variant="subtitle">Trending</Text>
            <Text variant="caption" color={colors.muted}>
              Editorial vibes
            </Text>
          </View>
          <View style={styles.padX}>
            {trends.length === 0 ? (
              <Text variant="body" color={colors.muted}>
                No trends match that search.
              </Text>
            ) : (
              trends.map((trend) => {
                const card: DiscoveryInspirationCard = {
                  id: trend.id,
                  kind: 'inspiration',
                  title: trend.title,
                  subtitle: trend.subtitle,
                  imageUri: trend.imageUri,
                  tags: trend.tags,
                  fixtureId: trend.fixtureId,
                };
                return (
                  <InspirationCard
                    key={trend.id}
                    card={card}
                    liked={likedIds.includes(card.id)}
                    onLike={() => onToggleLike(card.id)}
                    onVibeMatch={() =>
                      openVibeMatch(card.fixtureId, card.imageUri)
                    }
                  />
                );
              })
            )}
          </View>
        </Animated.View>
      ) : null}

      {showLiked ? (
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={styles.section}
        >
          <View style={[styles.sectionHead, styles.padX]}>
            <Text variant="subtitle">Liked</Text>
            <Text variant="caption" color={colors.muted}>
              Feeds For You & Today vibes
            </Text>
          </View>
          <View style={styles.padX}>
            {likedCards.length === 0 ? (
              <Text variant="body" color={colors.muted}>
                Like an inspiration to save it here and nudge similar looks.
              </Text>
            ) : (
              likedCards.map((card) => (
                <InspirationCard
                  key={card.id}
                  card={card}
                  liked
                  onLike={() => onToggleLike(card.id)}
                  onVibeMatch={() =>
                    openVibeMatch(card.fixtureId, card.imageUri)
                  }
                />
              ))
            )}
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.footerPad} />
    </Screen>
  );
}

function ClosetLookCard({
  look,
  pieces,
  avatarUri,
  heightCm,
  busy,
  onWear,
  onSave,
}: {
  look: DiscoveryLookCard;
  pieces: ReturnType<ReturnType<typeof useApp>['getItemsByIds']>;
  avatarUri?: string;
  heightCm?: number;
  busy: boolean;
  onWear: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.lookCard}>
      <OutfitAvatar
        pieces={pieces}
        avatarUri={avatarUri}
        heightCm={heightCm}
        style={styles.lookAvatar}
      />
      <Text variant="bodyMedium" numberOfLines={1}>
        {look.title}
      </Text>
      <Text variant="caption" color={colors.muted} numberOfLines={2}>
        {look.subtitle}
      </Text>
      <Button label={busy ? '…' : 'Wear This'} onPress={onWear} disabled={busy} />
      <Button
        label="Save look"
        variant="ghost"
        onPress={onSave}
        disabled={busy}
      />
    </View>
  );
}

function InspirationCard({
  card,
  liked,
  onLike,
  onVibeMatch,
}: {
  card: DiscoveryInspirationCard;
  liked: boolean;
  onLike: () => void;
  onVibeMatch: () => void;
}) {
  return (
    <View style={styles.inspCard}>
      <Image
        source={{ uri: card.imageUri }}
        style={styles.inspImage}
        contentFit="cover"
      />
      <View style={styles.inspMeta}>
        <Text variant="bodyMedium">{card.title}</Text>
        <Text variant="caption" color={colors.muted} numberOfLines={2}>
          {card.subtitle}
        </Text>
        <View style={styles.inspActions}>
          <Pressable
            onPress={onLike}
            style={styles.likeBtn}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? colors.accent : colors.primary}
            />
            <Text
              variant="caption"
              color={liked ? colors.accent : colors.primary}
            >
              {liked ? 'Liked' : 'Like'}
            </Text>
          </Pressable>
          <Button label="Vibe Match" onPress={onVibeMatch} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  padX: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  search: {
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
  filters: {
    paddingRight: spacing.lg,
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  lookCard: {
    width: 200,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  lookAvatar: {
    borderRadius: radii.md,
  },
  emptyBlock: {
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  inspCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  inspImage: {
    width: '100%',
    aspectRatio: 1.6,
    backgroundColor: colors.surfaceMuted,
  },
  inspMeta: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  inspActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  variantBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  variantAvatar: {
    width: 64,
  },
  variantMeta: {
    flex: 1,
    gap: 2,
  },
  footerPad: {
    height: spacing.xxl,
  },
});
