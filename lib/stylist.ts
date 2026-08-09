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

function pickFirst(
  items: ClothingItem[],
  category: ClothingItem['attributes']['category'],
  avoid: Set<string>,
): ClothingItem | undefined {
  return (
    items.find(
      (item) =>
        item.attributes.category === category && !avoid.has(item.id),
    ) || items.find((item) => item.attributes.category === category)
  );
}

function assembleFromWardrobe(
  items: ClothingItem[],
  occasion: string,
  avoid: Set<string>,
  index: number,
): StylistSuggestion | null {
  const dress = pickFirst(items, 'Dresses', avoid);
  const top = pickFirst(items, 'Tops', avoid);
  const bottom = pickFirst(items, 'Bottoms', avoid);
  const shoes = pickFirst(items, 'Shoes', avoid);
  const accessory =
    pickFirst(items, 'Accessories', avoid) ||
    pickFirst(items, 'Jewelry', avoid);

  let itemIds: string[] = [];
  let reason = '';

  if (index % 2 === 0 && dress) {
    itemIds = [dress.id, shoes?.id, accessory?.id].filter(Boolean) as string[];
    reason = `A ${dress.attributes.color.toLowerCase()} dress keeps this ${occasion.toLowerCase()} look simple.`;
  } else if (top && bottom) {
    itemIds = [top.id, bottom.id, shoes?.id, accessory?.id].filter(
      Boolean,
    ) as string[];
    reason = `Paired your ${top.name.toLowerCase()} with ${bottom.name.toLowerCase()} for ${occasion.toLowerCase()}.`;
  } else if (top || dress) {
    const lead = top || dress!;
    itemIds = [lead.id, shoes?.id].filter(Boolean) as string[];
    reason = `Built from available pieces for a quick ${occasion.toLowerCase()} option.`;
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
    reason,
  };
}

/**
 * Phase-1 style rule-based stylist (no ML yet).
 * Prefers saved outfits for the occasion, then builds from wardrobe,
 * avoiding pieces worn in the last few days when possible.
 */
export function suggestOutfitsForToday(options: {
  occasion: string;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  limit?: number;
}): StylistSuggestion[] {
  const { occasion, items, outfits, wearHistory, limit = 3 } = options;
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
    .sort((a, b) => {
      const aRecent = a.lastWornAt ? daysAgo(a.lastWornAt) : 999;
      const bRecent = b.lastWornAt ? daysAgo(b.lastWornAt) : 999;
      // Prefer not-recently-worn
      return bRecent - aRecent;
    });

  for (const outfit of matchingSaved) {
    if (suggestions.length >= limit) break;
    const wornRecently =
      outfit.lastWornAt && daysAgo(outfit.lastWornAt) <= RECENT_DAYS;
    suggestions.push({
      id: `suggest-saved-${outfit.id}`,
      title: outfit.name,
      occasion: outfit.occasion || occasion,
      itemIds: outfit.itemIds,
      sourceOutfitId: outfit.id,
      reason: wornRecently
        ? 'From your saved outfits — you wore this recently, but it still fits today.'
        : `From your saved ${occasion.toLowerCase()} outfits — fresh enough to wear again.`,
    });
  }

  let assembleIndex = 0;
  while (suggestions.length < limit && assembleIndex < 4) {
    const built = assembleFromWardrobe(items, occasion, avoid, assembleIndex);
    assembleIndex += 1;
    if (!built) break;
    const duplicate = suggestions.some(
      (s) => s.itemIds.slice().sort().join() === built.itemIds.slice().sort().join(),
    );
    if (!duplicate) {
      suggestions.push(built);
    }
  }

  return suggestions.slice(0, limit);
}
