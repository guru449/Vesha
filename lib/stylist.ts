import type {
  ClothingItem,
  Outfit,
  StylistSuggestion,
  WearHistoryEntry,
} from '@/data/types';
import type { WeatherSnapshot } from '@/lib/weather';

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

function haystackFor(item: ClothingItem): string {
  return [
    item.attributes.style,
    item.attributes.color,
    item.attributes.occasion,
    item.attributes.material,
    item.attributes.category,
    item.name,
  ]
    .join(' ')
    .toLowerCase();
}

function preferenceScore(item: ClothingItem, preferences: string[]): number {
  if (!preferences.length) return 0;
  const haystack = haystackFor(item);

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

function occasionScore(item: ClothingItem, occasion: string): number {
  const itemOcc = item.attributes.occasion.toLowerCase();
  const target = occasion.toLowerCase();
  if (itemOcc === target) return 4;
  if (itemOcc.includes(target) || target.includes(itemOcc)) return 3;
  if (itemOcc.includes('everyday')) return 2;
  if (target === 'casual' && /brunch|travel|weekend/.test(itemOcc)) return 2;
  if (target === 'work' && /smart|office/.test(itemOcc)) return 3;
  if (target === 'evening' && /elegant|dressy|party/.test(itemOcc)) return 3;
  return 0;
}

/** Score how well a piece fits today's weather. */
export function weatherScore(
  item: ClothingItem,
  weather?: WeatherSnapshot | null,
): number {
  if (!weather) return 0;
  const haystack = haystackFor(item);
  let score = 0;

  const light =
    /linen|cotton|silk|chiffon|sandal|sneaker|shorts|tee|tank|dress/.test(
      haystack,
    );
  const warm =
    /wool|knit|cashmere|fleece|coat|boot|leather|sweater|hoodie|jacket/.test(
      haystack,
    );
  const rainReady =
    /boot|leather|waterproof|trench|coat|closed/.test(haystack) ||
    item.attributes.category === 'Shoes';
  const openShoe = /sandal|flip|open toe|mule/.test(haystack);

  switch (weather.band) {
    case 'hot':
      if (light) score += 4;
      if (warm) score -= 4;
      if (/boot|wool|knit/.test(haystack)) score -= 3;
      break;
    case 'warm':
      if (light) score += 3;
      if (/wool|heavy/.test(haystack)) score -= 2;
      break;
    case 'mild':
      if (light || warm) score += 1;
      break;
    case 'cool':
      if (warm) score += 3;
      if (/linen|sandal|tank/.test(haystack)) score -= 2;
      break;
    case 'cold':
      if (warm) score += 5;
      if (light) score -= 4;
      if (/sandal|linen|tank|shorts/.test(haystack)) score -= 3;
      break;
  }

  if (weather.isRainy) {
    if (rainReady && item.attributes.category === 'Shoes') score += 4;
    if (openShoe) score -= 5;
    if (/canvas|suede/.test(haystack)) score -= 2;
    if (/trench|jacket|coat|boot/.test(haystack)) score += 2;
  }

  return score;
}

function itemScore(
  item: ClothingItem,
  occasion: string,
  avoid: Set<string>,
  preferences: string[],
  weather?: WeatherSnapshot | null,
  excluded?: Set<string>,
): number {
  let score =
    preferenceScore(item, preferences) +
    occasionScore(item, occasion) +
    weatherScore(item, weather) +
    (avoid.has(item.id) ? -5 : 2);
  if (excluded?.has(item.id)) score -= 8;
  return score;
}

function pickBest(
  items: ClothingItem[],
  category: ClothingItem['attributes']['category'],
  avoid: Set<string>,
  preferences: string[],
  occasion: string,
  weather?: WeatherSnapshot | null,
  excluded?: Set<string>,
): ClothingItem | undefined {
  const ranked = items
    .filter((item) => item.attributes.category === category)
    .map((item) => ({
      item,
      score: itemScore(
        item,
        occasion,
        avoid,
        preferences,
        weather,
        excluded,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.item;
}

function weatherReasonBit(weather?: WeatherSnapshot | null): string {
  if (!weather) return '';
  if (weather.isRainy) {
    return ` Picked with today’s rain (${Math.round(weather.feelsLikeC)}°C) in mind.`;
  }
  if (weather.band === 'hot' || weather.band === 'warm') {
    return ` Kept it lighter for ${Math.round(weather.feelsLikeC)}°C.`;
  }
  if (weather.band === 'cool' || weather.band === 'cold') {
    return ` Leaned warmer for ${Math.round(weather.feelsLikeC)}°C.`;
  }
  return ` Tuned for ${Math.round(weather.feelsLikeC)}°C and ${weather.label.toLowerCase()}.`;
}

function assembleFromWardrobe(
  items: ClothingItem[],
  occasion: string,
  avoid: Set<string>,
  preferences: string[],
  index: number,
  weather?: WeatherSnapshot | null,
  excluded?: Set<string>,
): StylistSuggestion | null {
  const dress = pickBest(
    items,
    'Dresses',
    avoid,
    preferences,
    occasion,
    weather,
    excluded,
  );
  const top = pickBest(
    items,
    'Tops',
    avoid,
    preferences,
    occasion,
    weather,
    excluded,
  );
  const bottom = pickBest(
    items,
    'Bottoms',
    avoid,
    preferences,
    occasion,
    weather,
    excluded,
  );
  const shoes = pickBest(
    items,
    'Shoes',
    avoid,
    preferences,
    occasion,
    weather,
    excluded,
  );
  const accessory =
    pickBest(
      items,
      'Accessories',
      avoid,
      preferences,
      occasion,
      weather,
      excluded,
    ) ||
    pickBest(
      items,
      'Jewelry',
      avoid,
      preferences,
      occasion,
      weather,
      excluded,
    );

  let itemIds: string[] = [];
  let reason = '';
  const prefNote = preferences.length
    ? ` Tuned for ${preferences.slice(0, 2).join(' + ').toLowerCase()}.`
    : '';
  const weatherNote = weatherReasonBit(weather);

  // Prefer separates in rain / cold; dresses more on warm clear days.
  const preferDress =
    Boolean(dress) &&
    !weather?.isRainy &&
    weather?.band !== 'cold' &&
    (index % 2 === 0 || !top || !bottom);

  if (preferDress && dress) {
    itemIds = [dress.id, shoes?.id, accessory?.id].filter(Boolean) as string[];
    reason = `A ${dress.attributes.color.toLowerCase()} dress keeps this ${occasion.toLowerCase()} look simple.${prefNote}${weatherNote}`;
  } else if (top && bottom) {
    itemIds = [top.id, bottom.id, shoes?.id, accessory?.id].filter(
      Boolean,
    ) as string[];
    reason = `Paired your ${top.name.toLowerCase()} with ${bottom.name.toLowerCase()} for ${occasion.toLowerCase()}.${prefNote}${weatherNote}`;
  } else if (top || dress) {
    const lead = top || dress!;
    itemIds = [lead.id, shoes?.id].filter(Boolean) as string[];
    reason = `Built from available pieces for a quick ${occasion.toLowerCase()} option.${prefNote}${weatherNote}`;
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
 * Rule-based stylist.
 * Uses occasion, wear history, style preferences, and optional weather.
 */
export function suggestOutfitsForToday(options: {
  occasion: string;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  stylePreferences?: string[];
  weather?: WeatherSnapshot | null;
  limit?: number;
}): StylistSuggestion[] {
  const {
    occasion,
    items,
    outfits,
    wearHistory,
    stylePreferences = [],
    weather = null,
    limit = 3,
  } = options;
  const avoid = recentlyWornItemIds(wearHistory);
  const suggestions: StylistSuggestion[] = [];
  const usedItemIds = new Set<string>();

  const matchingSaved = outfits
    .map((outfit) => {
      const pieces = outfit.itemIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as ClothingItem[];
      const occ = (outfit.occasion || '').toLowerCase();
      const occasionMatch =
        !occ ||
        occ === occasion.toLowerCase() ||
        (occasion === 'Casual' && occ.includes('casual')) ||
        (occasion === 'Work' &&
          (occ.includes('work') || occ.includes('smart')));
      const prefScore = pieces.reduce(
        (sum, item) => sum + preferenceScore(item, stylePreferences),
        0,
      );
      const weatherPts = pieces.reduce(
        (sum, item) => sum + weatherScore(item, weather),
        0,
      );
      const freshness = outfit.lastWornAt ? daysAgo(outfit.lastWornAt) : 999;
      return {
        outfit,
        pieces,
        occasionMatch,
        prefScore,
        weatherPts,
        freshness,
        total: (occasionMatch ? 10 : 0) + prefScore + weatherPts + Math.min(freshness, 30) * 0.1,
      };
    })
    .sort((a, b) => b.total - a.total);

  for (const { outfit, prefScore, weatherPts, occasionMatch } of matchingSaved) {
    if (suggestions.length >= limit) break;
    if (!occasionMatch && suggestions.length > 0) continue;

    const wornRecently =
      outfit.lastWornAt && daysAgo(outfit.lastWornAt) <= RECENT_DAYS;
    const prefBit =
      prefScore > 0 && stylePreferences.length
        ? ` Matches your ${stylePreferences[0].toLowerCase()} preference.`
        : '';
    const weatherBit =
      weather && weatherPts !== 0 ? weatherReasonBit(weather) : '';

    suggestions.push({
      id: `suggest-saved-${outfit.id}`,
      title: outfit.name,
      occasion: outfit.occasion || occasion,
      itemIds: outfit.itemIds,
      sourceOutfitId: outfit.id,
      reason: wornRecently
        ? `From your saved outfits — worn recently, but still a fit.${prefBit}${weatherBit}`
        : `From your saved ${occasion.toLowerCase()} outfits — fresh enough to wear again.${prefBit}${weatherBit}`,
    });
    outfit.itemIds.forEach((id) => usedItemIds.add(id));
  }

  let assembleIndex = 0;
  while (suggestions.length < limit && assembleIndex < 6) {
    const built = assembleFromWardrobe(
      items,
      occasion,
      avoid,
      stylePreferences,
      assembleIndex,
      weather,
      usedItemIds,
    );
    assembleIndex += 1;
    if (!built) break;
    const duplicate = suggestions.some(
      (s) =>
        s.itemIds.slice().sort().join() === built.itemIds.slice().sort().join(),
    );
    if (!duplicate) {
      suggestions.push(built);
      built.itemIds.forEach((id) => usedItemIds.add(id));
    }
  }

  return suggestions.slice(0, limit);
}
