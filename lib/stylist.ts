import type {
  ClothingItem,
  Outfit,
  StylistSuggestion,
  WearHistoryEntry,
} from '@/data/types';
import type { WeatherSnapshot } from '@/lib/weather';

const RECENT_DAYS = 3;
const NEGLECTED_DAYS = 14;

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

function lastWornMap(history: WearHistoryEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of history) {
    for (const id of entry.itemIds) {
      const prev = map.get(id);
      if (!prev || new Date(entry.wornAt) > new Date(prev)) {
        map.set(id, entry.wornAt);
      }
    }
  }
  return map;
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

/** Prefer neglected pieces so suggestions feel less repetitive. */
function neglectScore(
  item: ClothingItem,
  lastWorn: Map<string, string>,
): number {
  const iso = item.lastWornAt || lastWorn.get(item.id);
  if (!iso) return 3;
  const age = daysAgo(iso);
  if (age >= NEGLECTED_DAYS) return 2;
  if (age >= 7) return 1;
  return 0;
}

function itemScore(
  item: ClothingItem,
  occasion: string,
  avoid: Set<string>,
  preferences: string[],
  weather: WeatherSnapshot | null | undefined,
  excluded: Set<string> | undefined,
  lastWorn: Map<string, string>,
): number {
  const weatherPts = weatherScore(item, weather);
  let score =
    preferenceScore(item, preferences) +
    occasionScore(item, occasion) +
    weatherPts * 1.5 +
    neglectScore(item, lastWorn) +
    (avoid.has(item.id) ? -5 : 2);
  if (excluded?.has(item.id)) score -= 8;
  // Hard weather veto so alternates don’t grab sweaters on hot days.
  if (weatherPts <= -3) score -= 12;
  return score;
}

function pickRanked(
  items: ClothingItem[],
  category: ClothingItem['attributes']['category'],
  avoid: Set<string>,
  preferences: string[],
  occasion: string,
  weather: WeatherSnapshot | null | undefined,
  excluded: Set<string> | undefined,
  lastWorn: Map<string, string>,
  rankOffset = 0,
): ClothingItem | undefined {
  const scored = items
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
        lastWorn,
      ),
      weatherPts: weatherScore(item, weather),
    }))
    .sort((a, b) => b.score - a.score);

  const viable = scored.filter((entry) => entry.weatherPts > -3);
  const pool = viable.length ? viable : scored;

  return pool[rankOffset]?.item ?? pool[0]?.item;
}

function joinReason(bits: string[]): string {
  return bits.filter(Boolean).join(' · ');
}

function weatherReasonBit(weather?: WeatherSnapshot | null): string {
  if (!weather) return '';
  const temp = Math.round(weather.feelsLikeC);
  if (weather.isRainy) return `rain-ready for ${temp}°C`;
  if (weather.band === 'hot' || weather.band === 'warm') {
    return `light for ${temp}°C`;
  }
  if (weather.band === 'cool' || weather.band === 'cold') {
    return `warmer for ${temp}°C`;
  }
  return `${temp}°C · ${weather.label.toLowerCase()}`;
}

function freshnessBit(
  itemIds: string[],
  avoid: Set<string>,
  lastWorn: Map<string, string>,
  itemsById: Map<string, ClothingItem>,
): string {
  const fresh = itemIds.filter((id) => !avoid.has(id));
  if (avoid.size > 0 && fresh.length === itemIds.length) {
    return 'skipped recent wears';
  }
  let oldestDays = 0;
  let anyNever = false;
  for (const id of itemIds) {
    const item = itemsById.get(id);
    const iso = item?.lastWornAt || lastWorn.get(id);
    if (!iso) {
      anyNever = true;
      continue;
    }
    oldestDays = Math.max(oldestDays, Math.floor(daysAgo(iso)));
  }
  if (anyNever) return 'includes unworn pieces';
  if (oldestDays >= NEGLECTED_DAYS) {
    return 'leans on less-worn pieces';
  }
  return '';
}

function comboTitle(options: {
  index: number;
  occasion: string;
  weather?: WeatherSnapshot | null;
  dressLed: boolean;
  leadColor?: string;
}): string {
  const { index, occasion, weather, dressLed, leadColor } = options;
  if (weather?.isRainy && index === 0) return 'Rain-ready look';
  if (
    (weather?.band === 'hot' || weather?.band === 'warm') &&
    index === 0
  ) {
    return 'Keep it light';
  }
  if (
    (weather?.band === 'cool' || weather?.band === 'cold') &&
    index === 0
  ) {
    return 'Layer-friendly';
  }
  if (dressLed && index === 0) return 'Easy dress day';
  if (occasion === 'Work' && index === 0) return 'Work-ready';
  if (occasion === 'Evening' && index === 0) return 'Evening polish';
  if (occasion === 'Brunch' && index === 0) return 'Brunch outfit';
  if (occasion === 'Travel' && index === 0) return 'Travel easy';
  if (index === 1) return 'Change of pace';
  if (index === 2) return leadColor ? `${leadColor} alternate` : 'Third option';
  return 'Fresh combo';
}

function assembleFromWardrobe(
  items: ClothingItem[],
  occasion: string,
  avoid: Set<string>,
  preferences: string[],
  index: number,
  weather: WeatherSnapshot | null | undefined,
  excluded: Set<string> | undefined,
  lastWorn: Map<string, string>,
): StylistSuggestion | null {
  const rankOffset = index; // rotate picks so look #2 ≠ look #1
  // Only rotate / exclude core garments — shoes & accessories can repeat.
  const pickCore = (
    category: ClothingItem['attributes']['category'],
    offset = rankOffset,
  ) =>
    pickRanked(
      items,
      category,
      avoid,
      preferences,
      occasion,
      weather,
      excluded,
      lastWorn,
      offset,
    );
  const pickExtra = (category: ClothingItem['attributes']['category']) =>
    pickRanked(
      items,
      category,
      avoid,
      preferences,
      occasion,
      weather,
      undefined,
      lastWorn,
      0,
    );

  const dress = pickCore('Dresses', index % 2);
  const top = pickCore('Tops');
  const bottom = pickCore('Bottoms', Math.max(0, index - (top ? 0 : 1)));
  const shoes = pickExtra('Shoes');
  const accessory = pickExtra('Accessories') || pickExtra('Jewelry');

  const itemsById = new Map(items.map((item) => [item.id, item]));
  let itemIds: string[] = [];
  let dressLed = false;
  const bits: string[] = [];

  // Prefer dresses on warm/clear days and for evening; separates in rain/cold.
  const preferDress =
    Boolean(dress) &&
    !weather?.isRainy &&
    weather?.band !== 'cold' &&
    (occasion === 'Evening' ||
      occasion === 'Brunch' ||
      weather?.band === 'hot' ||
      weather?.band === 'warm' ||
      index % 2 === 0 ||
      !top ||
      !bottom);

  if (preferDress && dress) {
    dressLed = true;
    itemIds = [dress.id, shoes?.id, accessory?.id].filter(Boolean) as string[];
    bits.push(
      `${dress.attributes.color.toLowerCase()} dress for ${occasion.toLowerCase()}`,
    );
  } else if (top && bottom) {
    itemIds = [top.id, bottom.id, shoes?.id, accessory?.id].filter(
      Boolean,
    ) as string[];
    bits.push(
      `${top.attributes.color.toLowerCase()} top + ${bottom.name.toLowerCase()}`,
    );
  } else if (top || dress) {
    const lead = top || dress!;
    itemIds = [lead.id, shoes?.id].filter(Boolean) as string[];
    bits.push(`built from ${lead.name.toLowerCase()}`);
  }

  if (itemIds.length < 2) return null;

  if (preferences.length) {
    bits.push(`fits ${preferences.slice(0, 2).join(' + ').toLowerCase()}`);
  }
  const weatherBit = weatherReasonBit(weather);
  if (weatherBit) bits.push(weatherBit);
  const freshBit = freshnessBit(itemIds, avoid, lastWorn, itemsById);
  if (freshBit) bits.push(freshBit);

  const lead = itemsById.get(itemIds[0]!);

  return {
    id: `suggest-ward-${index}-${itemIds.join('-')}`,
    title: comboTitle({
      index,
      occasion,
      weather,
      dressLed,
      leadColor: lead?.attributes.color,
    }),
    occasion,
    itemIds,
    reason: joinReason(bits),
  };
}

export type WardrobeGapHint = {
  message: string;
  missing: string[];
};

/** Explain why suggestions are empty and what to add. */
export function diagnoseWardrobeGaps(options: {
  occasion: string;
  items: ClothingItem[];
}): WardrobeGapHint {
  const { occasion, items } = options;
  if (items.length === 0) {
    return {
      message: 'Your wardrobe is empty. Add a few pieces to get suggestions.',
      missing: ['tops or a dress', 'bottoms', 'shoes'],
    };
  }

  const counts = items.reduce(
    (acc, item) => {
      acc[item.attributes.category] = (acc[item.attributes.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const missing: string[] = [];
  const hasDress = (counts.Dresses || 0) > 0;
  const hasTop = (counts.Tops || 0) > 0;
  const hasBottom = (counts.Bottoms || 0) > 0;
  const hasShoes = (counts.Shoes || 0) > 0;

  if (!hasDress && !hasTop) missing.push('a top or dress');
  if (!hasDress && !hasBottom) missing.push('bottoms');
  if (!hasShoes) missing.push('shoes');

  if (missing.length) {
    return {
      message: `Not enough pieces for a ${occasion.toLowerCase()} look yet. Add ${missing.join(' and ')}.`,
      missing,
    };
  }

  return {
    message: `Couldn’t build a solid ${occasion.toLowerCase()} look from what’s tagged. Try another occasion, or add more variety.`,
    missing: [],
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
  /** Sorted item-id keys to skip (e.g. after “Not feeling it”) */
  excludeKeys?: string[];
}): StylistSuggestion[] {
  const {
    occasion,
    items,
    outfits,
    wearHistory,
    stylePreferences = [],
    weather = null,
    limit = 3,
    excludeKeys = [],
  } = options;
  const avoid = recentlyWornItemIds(wearHistory);
  const lastWorn = lastWornMap(wearHistory);
  const suggestions: StylistSuggestion[] = [];
  const usedItemIds = new Set<string>();
  const excluded = new Set(excludeKeys);

  const comboKey = (ids: string[]) => ids.slice().sort().join('|');

  const matchingSaved = outfits
    .map((outfit) => {
      const pieces = outfit.itemIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as ClothingItem[];
      const occ = (outfit.occasion || '').toLowerCase();
      const target = occasion.toLowerCase();
      const occasionMatch =
        !occ ||
        occ === target ||
        (target === 'casual' &&
          (occ.includes('casual') || occ.includes('brunch'))) ||
        (target === 'brunch' &&
          (occ.includes('brunch') || occ.includes('casual'))) ||
        (target === 'work' &&
          (occ.includes('work') || occ.includes('smart'))) ||
        (target === 'travel' &&
          (occ.includes('travel') || occ.includes('casual'))) ||
        (target === 'evening' &&
          (occ.includes('evening') || occ.includes('party')));
      const prefScore = pieces.reduce(
        (sum, item) => sum + preferenceScore(item, stylePreferences),
        0,
      );
      const weatherPts = pieces.reduce(
        (sum, item) => sum + weatherScore(item, weather),
        0,
      );
      const neglectPts = pieces.reduce(
        (sum, item) => sum + neglectScore(item, lastWorn),
        0,
      );
      const freshness = outfit.lastWornAt ? daysAgo(outfit.lastWornAt) : 999;
      const pinnedBoost = outfit.isPinned ? 8 : 0;
      // Saved looks that fight the weather sink hard.
      const weatherPenalty = weatherPts <= -4 ? -20 : 0;
      return {
        outfit,
        pieces,
        occasionMatch,
        prefScore,
        weatherPts,
        freshness,
        total:
          (occasionMatch ? 12 : -30) +
          prefScore +
          weatherPts +
          neglectPts +
          pinnedBoost +
          weatherPenalty +
          Math.min(freshness, 30) * 0.15,
      };
    })
    .sort((a, b) => b.total - a.total);

  for (const { outfit, prefScore, weatherPts, occasionMatch } of matchingSaved) {
    if (suggestions.length >= limit) break;
    if (!occasionMatch) continue;
    if (weatherPts <= -4) continue;
    if (excluded.has(comboKey(outfit.itemIds))) continue;

    const wornRecently =
      outfit.lastWornAt && daysAgo(outfit.lastWornAt) <= RECENT_DAYS;
    const bits: string[] = [outfit.isPinned ? 'pinned look' : 'saved outfit'];
    if (wornRecently) bits.push('worn recently');
    else if (outfit.lastWornAt) {
      bits.push(`last worn ${Math.floor(daysAgo(outfit.lastWornAt))}d ago`);
    } else {
      bits.push('not worn yet');
    }
    if (prefScore > 0 && stylePreferences.length) {
      bits.push(`fits ${stylePreferences[0].toLowerCase()}`);
    }
    if (weather && weatherPts !== 0) {
      bits.push(weatherReasonBit(weather));
    }

    suggestions.push({
      id: `suggest-saved-${outfit.id}`,
      title: outfit.name,
      occasion: outfit.occasion || occasion,
      itemIds: outfit.itemIds,
      sourceOutfitId: outfit.id,
      reason: joinReason(bits),
    });
    outfit.itemIds.forEach((id) => usedItemIds.add(id));
  }

  let assembleIndex = 0;
  while (suggestions.length < limit && assembleIndex < 12) {
    const built = assembleFromWardrobe(
      items,
      occasion,
      avoid,
      stylePreferences,
      assembleIndex,
      weather,
      usedItemIds,
      lastWorn,
    );
    assembleIndex += 1;
    if (!built) {
      if (assembleIndex > 3) break;
      continue;
    }
    if (excluded.has(comboKey(built.itemIds))) continue;
    const duplicate = suggestions.some(
      (s) => comboKey(s.itemIds) === comboKey(built.itemIds),
    );
    if (!duplicate) {
      // Re-title using suggestion slot so #2/#3 read as alternates
      const slot = suggestions.length;
      const lead = items.find((item) => item.id === built.itemIds[0]);
      suggestions.push({
        ...built,
        title: comboTitle({
          index: slot,
          occasion,
          weather,
          dressLed: /dress/i.test(built.title) || Boolean(
            lead && lead.attributes.category === 'Dresses',
          ),
          leadColor: lead?.attributes.color,
        }),
        id: `suggest-ward-${slot}-${built.itemIds.join('-')}`,
      });
      built.itemIds.forEach((id) => usedItemIds.add(id));
    }
  }

  return suggestions.slice(0, limit);
}
