import type {
  ClothingItem,
  Outfit,
  StylistSuggestion,
  WearHistoryEntry,
} from '@/data/types';

const RECENT_DAYS = 3;

function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function recentlyWornItemIds(history: WearHistoryEntry[]): Set<string> {
  const recent = new Set<string>();
  for (const entry of history) {
    if (daysAgo(entry.wornAt) <= RECENT_DAYS) {
      entry.itemIds.forEach((id) => recent.add(id));
    }
  }
  return recent;
}

function preferenceScore(item: ClothingItem, preferences: string[]): number {
  if (!preferences.length) return 0;
  const haystack = [
    item.attributes.style,
    item.attributes.color,
    item.attributes.occasion,
    item.attributes.material,
    item.name,
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;
  for (const pref of preferences) {
    const p = pref.toLowerCase();
    if (haystack.includes(p)) score += 3;
    if (p.includes('minimal') && /solid|classic|crew|linen/.test(haystack)) {
      score += 2;
    }
    if (p.includes('earthy') && /sage|cream|cognac|natural|dusty|navy/.test(haystack)) {
      score += 2;
    }
    if (p.includes('smart') && /work|smart|crew|trouser|boot/.test(haystack)) {
      score += 2;
    }
    if (p.includes('street') && /denim|tote|hoodie|sneaker/.test(haystack)) {
      score += 2;
    }
    if (p.includes('elegant') && /dress|knit|gold|midi/.test(haystack)) {
      score += 2;
    }
    if (p.includes('sport') && /jogger|sneaker|active|sport/.test(haystack)) {
      score += 2;
    }
    if (p.includes('color') && !/cream|ivory|navy|black|white|natural/.test(haystack)) {
      score += 1;
    }
  }
  return score;
}

function pickBest(
  items: ClothingItem[],
  category: ClothingItem['attributes']['category'],
  avoid: Set<string>,
  preferences: string[],
): ClothingItem | undefined {
  const ranked = items
    .filter((item) => item.attributes.category === category)
    .map((item) => ({
      item,
      score:
        preferenceScore(item, preferences) + (avoid.has(item.id) ? -5 : 2),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.item;
}

function assembleFromWardrobe(
  items: ClothingItem[],
  occasion: string,
  avoid: Set<string>,
  preferences: string[],
  index: number,
): StylistSuggestion | null {
  const dress = pickBest(items, 'Dresses', avoid, preferences);
  const top = pickBest(items, 'Tops', avoid, preferences);
  const bottom = pickBest(items, 'Bottoms', avoid, preferences);
  const shoes = pickBest(items, 'Shoes', avoid, preferences);
  const accessory =
    pickBest(items, 'Accessories', avoid, preferences) ||
    pickBest(items, 'Jewelry', avoid, preferences);

  let itemIds: string[] = [];
  let reason = '';
  const prefNote = preferences.length
    ? ` Tuned for ${preferences.slice(0, 2).join(' + ').toLowerCase()}.`
    : '';

  if (index % 2 === 0 && dress) {
    itemIds = [dress.id, shoes?.id, accessory?.id].filter(Boolean) as string[];
    reason = `A ${dress.attributes.color.toLowerCase()} dress keeps this ${occasion.toLowerCase()} look simple.${prefNote}`;
  } else if (top && bottom) {
    itemIds = [top.id, bottom.id, shoes?.id, accessory?.id].filter(
      Boolean,
    ) as string[];
    reason = `Paired your ${top.name.toLowerCase()} with ${bottom.name.toLowerCase()} for ${occasion.toLowerCase()}.${prefNote}`;
  } else if (top || dress) {
    const lead = top || dress!;
    itemIds = [lead.id, shoes?.id].filter(Boolean) as string[];
    reason = `Built from available pieces for a quick ${occasion.toLowerCase()} option.${prefNote}`;
  }

  if (itemIds.length < 2) return null;

  const avoidedCount = itemIds.filter((id) => !avoid.has(id)).length;
  if (avoid.size > 0 && avoidedCount === itemIds.length) {
    reason += ' Skipped recently worn pieces.';
  }

  return {
    id: `suggest-ward-${index}-${itemIds.join('-')}`,
    title: index === 0 ? 'Fresh combo' : 'Alternate look',
    occasion,
    itemIds,
    reason: reason.trim(),
  };
}

/**
 * Rule-based stylist (no ML yet).
 * Uses occasion, wear history, and style preferences.
 */
export function suggestOutfitsForToday(options: {
  occasion: string;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  stylePreferences?: string[];
  limit?: number;
}): StylistSuggestion[] {
  const {
    occasion,
    items,
    outfits,
    wearHistory,
    stylePreferences = [],
    limit = 3,
  } = options;
  const avoid = recentlyWornItemIds(wearHistory);
  const suggestions: StylistSuggestion[] = [];

  const matchingSaved = outfits
    .filter((outfit) => {
      const occ = (outfit.occasion || '').toLowerCase();
      return (
        !occ ||
        occ === occasion.toLowerCase() ||
        (occasion === 'Casual' && occ.includes('casual')) ||
        (occasion === 'Work' && (occ.includes('work') || occ.includes('smart')))
      );
    })
    .map((outfit) => {
      const pieces = outfit.itemIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as ClothingItem[];
      const prefScore = pieces.reduce(
        (sum, item) => sum + preferenceScore(item, stylePreferences),
        0,
      );
      const freshness = outfit.lastWornAt ? daysAgo(outfit.lastWornAt) : 999;
      return { outfit, prefScore, freshness };
    })
    .sort((a, b) => {
      if (b.prefScore !== a.prefScore) return b.prefScore - a.prefScore;
      return b.freshness - a.freshness;
    });

  for (const { outfit, prefScore } of matchingSaved) {
    if (suggestions.length >= limit) break;
    const wornRecently =
      outfit.lastWornAt && daysAgo(outfit.lastWornAt) <= RECENT_DAYS;
    const prefBit =
      prefScore > 0 && stylePreferences.length
        ? ` Matches your ${stylePreferences[0].toLowerCase()} preference.`
        : '';
    suggestions.push({
      id: `suggest-saved-${outfit.id}`,
      title: outfit.name,
      occasion: outfit.occasion || occasion,
      itemIds: outfit.itemIds,
      sourceOutfitId: outfit.id,
      reason: wornRecently
        ? `From your saved outfits — worn recently, but still a fit.${prefBit}`
        : `From your saved ${occasion.toLowerCase()} outfits — fresh enough to wear again.${prefBit}`,
    });
  }

  let assembleIndex = 0;
  while (suggestions.length < limit && assembleIndex < 4) {
    const built = assembleFromWardrobe(
      items,
      occasion,
      avoid,
      stylePreferences,
      assembleIndex,
    );
    assembleIndex += 1;
    if (!built) break;
    const duplicate = suggestions.some(
      (s) =>
        s.itemIds.slice().sort().join() === built.itemIds.slice().sort().join(),
    );
    if (!duplicate) {
      suggestions.push(built);
    }
  }

  return suggestions.slice(0, limit);
}
