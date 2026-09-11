import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ClothingItem, Outfit, StylistSuggestion, WearHistoryEntry } from '@/data/types';
import {
  discoveryOccasions,
  discoverySearchHaystack,
  fixtureForDiscovery,
  trendingCollections,
  type DiscoveryOccasion,
  type TrendingCollection,
} from '@/data/discoveryContent';
import { suggestOutfitsForToday } from '@/lib/stylist';
import { matchFixtureById, type VibeMatchResult } from '@/lib/vibeMatch';

const LIKES_KEY = 'vesha.discoveryLikes';

export type DiscoveryLookCard = {
  id: string;
  kind: 'closet';
  title: string;
  subtitle: string;
  occasion: string;
  itemIds: string[];
  reason: string;
  sourceOutfitId?: string;
};

export type DiscoveryInspirationCard = {
  id: string;
  kind: 'inspiration';
  title: string;
  subtitle: string;
  imageUri: string;
  tags: string[];
  fixtureId: string;
};

export async function loadDiscoveryLikes(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LIKES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDiscoveryLikes(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(ids));
}

export async function toggleDiscoveryLike(id: string): Promise<string[]> {
  const current = await loadDiscoveryLikes();
  const next = current.includes(id)
    ? current.filter((row) => row !== id)
    : [...current, id];
  await saveDiscoveryLikes(next);
  return next;
}

/**
 * Labels from liked inspiration cards — feed into stylist preferences.
 */
export function likedVibeLabels(
  likedIds: string[],
  inspirations: DiscoveryInspirationCard[],
): string[] {
  const labels = new Set<string>();
  for (const id of likedIds) {
    const card = inspirations.find((row) => row.id === id);
    card?.tags.forEach((tag) => labels.add(tag));
    const fixture = card ? fixtureForDiscovery(card.fixtureId) : undefined;
    fixture?.vibeLabels.forEach((tag) => labels.add(tag));
  }
  return [...labels];
}

export function buildInspirationCards(): DiscoveryInspirationCard[] {
  const fromTrends: DiscoveryInspirationCard[] = trendingCollections.map(
    (row) => ({
      id: row.id,
      kind: 'inspiration',
      title: row.title,
      subtitle: row.subtitle,
      imageUri: row.imageUri,
      tags: row.tags,
      fixtureId: row.fixtureId,
    }),
  );

  const fromOccasions: DiscoveryInspirationCard[] = discoveryOccasions.map(
    (row) => {
      const fixture = fixtureForDiscovery(row.fixtureId);
      return {
        id: `occ-${row.id}`,
        kind: 'inspiration',
        title: row.label,
        subtitle: row.blurb,
        imageUri: fixture?.imageUri ?? trendingCollections[0]!.imageUri,
        tags: [row.label.toLowerCase(), row.stylistOccasion.toLowerCase()],
        fixtureId: row.fixtureId,
      };
    },
  );

  return [...fromTrends, ...fromOccasions];
}

export function buildForYouLooks(options: {
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  stylePreferences?: string[];
  likedLabels?: string[];
  limit?: number;
}): DiscoveryLookCard[] {
  const {
    items,
    outfits,
    wearHistory,
    stylePreferences = [],
    likedLabels = [],
    limit = 6,
  } = options;

  const mergedPrefs = [...stylePreferences, ...likedLabels];
  const occasions = ['Casual', 'Work', 'Brunch', 'Evening', 'Travel'];
  const cards: DiscoveryLookCard[] = [];
  const seen = new Set<string>();

  for (const occasion of occasions) {
    const suggestions = suggestOutfitsForToday({
      occasion,
      items,
      outfits,
      wearHistory,
      stylePreferences: mergedPrefs,
      limit: 2,
    });
    for (const suggestion of suggestions) {
      const key = suggestion.itemIds.slice().sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push({
        id: `foryou-${suggestion.id}`,
        kind: 'closet',
        title: suggestion.title,
        subtitle: `From your closet · ${suggestion.occasion}`,
        occasion: suggestion.occasion,
        itemIds: suggestion.itemIds,
        reason: suggestion.reason,
        sourceOutfitId: suggestion.sourceOutfitId,
      });
      if (cards.length >= limit) return cards;
    }
  }
  return cards;
}

export function closetVariantsForOccasion(options: {
  occasion: DiscoveryOccasion;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  stylePreferences?: string[];
  likedLabels?: string[];
}): {
  inspiration: DiscoveryInspirationCard;
  looks: DiscoveryLookCard[];
  vibePreview: VibeMatchResult | null;
} {
  const {
    occasion,
    items,
    outfits,
    wearHistory,
    stylePreferences = [],
    likedLabels = [],
  } = options;
  const fixture = fixtureForDiscovery(occasion.fixtureId);
  const inspiration: DiscoveryInspirationCard = {
    id: `occ-${occasion.id}`,
    kind: 'inspiration',
    title: occasion.label,
    subtitle: occasion.blurb,
    imageUri: fixture?.imageUri ?? '',
    tags: [occasion.label.toLowerCase(), occasion.stylistOccasion.toLowerCase()],
    fixtureId: occasion.fixtureId,
  };

  const suggestions = suggestOutfitsForToday({
    occasion: occasion.stylistOccasion,
    items,
    outfits,
    wearHistory,
    stylePreferences: [...stylePreferences, ...likedLabels],
    limit: 3,
  });

  const looks: DiscoveryLookCard[] = suggestions.map((s: StylistSuggestion) => ({
    id: `occ-look-${occasion.id}-${s.id}`,
    kind: 'closet',
    title: s.title,
    subtitle: `Your ${occasion.label.toLowerCase()} version`,
    occasion: s.occasion,
    itemIds: s.itemIds,
    reason: s.reason,
    sourceOutfitId: s.sourceOutfitId,
  }));

  const vibePreview = matchFixtureById(occasion.fixtureId, items);

  return { inspiration, looks, vibePreview };
}

export function filterByNlQuery<T>(
  rows: T[],
  query: string,
  fields: (row: T) => string[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  const tokens = q.split(/[^a-z0-9+]+/).filter(Boolean);
  return rows.filter((row) => {
    const hay = discoverySearchHaystack(fields(row));
    return tokens.every((token) => hay.includes(token));
  });
}

export function filterOccasions(query: string): DiscoveryOccasion[] {
  return filterByNlQuery(discoveryOccasions, query, (row) => [
    row.stylistOccasion,
    row.blurb,
    row.label,
  ]);
}

export function filterTrends(query: string): TrendingCollection[] {
  return filterByNlQuery(trendingCollections, query, (row) => [
    row.title,
    row.subtitle,
    ...row.tags,
  ]);
}
