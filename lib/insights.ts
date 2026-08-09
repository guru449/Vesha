import type { ClothingCategory } from '@/constants/theme';
import type { ClothingItem, WearHistoryEntry } from '@/data/types';

export type ItemWearStat = {
  item: ClothingItem;
  wearCount: number;
  lastWornAt?: string;
};

export type CategoryStat = {
  category: ClothingCategory | string;
  count: number;
  percent: number;
};

export type WardrobeInsights = {
  totalPieces: number;
  totalWears: number;
  mostWorn: ItemWearStat[];
  neglected: ItemWearStat[];
  categories: CategoryStat[];
  topColors: { color: string; count: number }[];
};

function buildWearCounts(history: WearHistoryEntry[]): Map<string, { count: number; lastWornAt?: string }> {
  const map = new Map<string, { count: number; lastWornAt?: string }>();
  for (const entry of history) {
    for (const itemId of entry.itemIds) {
      const prev = map.get(itemId) || { count: 0, lastWornAt: undefined };
      const newer =
        !prev.lastWornAt ||
        new Date(entry.wornAt).getTime() > new Date(prev.lastWornAt).getTime();
      map.set(itemId, {
        count: prev.count + 1,
        lastWornAt: newer ? entry.wornAt : prev.lastWornAt,
      });
    }
  }
  return map;
}

export function computeWardrobeInsights(
  items: ClothingItem[],
  wearHistory: WearHistoryEntry[],
): WardrobeInsights {
  const wearCounts = buildWearCounts(wearHistory);
  const totalWears = wearHistory.length;

  const stats: ItemWearStat[] = items.map((item) => {
    const wear = wearCounts.get(item.id);
    return {
      item,
      wearCount: wear?.count ?? 0,
      lastWornAt: wear?.lastWornAt,
    };
  });

  const mostWorn = [...stats]
    .filter((s) => s.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 5);

  const neglected = [...stats]
    .sort((a, b) => {
      if (a.wearCount !== b.wearCount) return a.wearCount - b.wearCount;
      return (
        new Date(a.item.createdAt).getTime() -
        new Date(b.item.createdAt).getTime()
      );
    })
    .slice(0, 5);

  const categoryMap = new Map<string, number>();
  for (const item of items) {
    const key = item.attributes.category;
    categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
  }
  const categories: CategoryStat[] = [...categoryMap.entries()]
    .map(([category, count]) => ({
      category,
      count,
      percent: items.length ? Math.round((count / items.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const colorMap = new Map<string, number>();
  for (const item of items) {
    const key = item.attributes.color;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  const topColors = [...colorMap.entries()]
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalPieces: items.length,
    totalWears,
    mostWorn,
    neglected,
    categories,
    topColors,
  };
}

export const STYLE_PREFERENCE_OPTIONS = [
  'Minimal',
  'Smart casual',
  'Earthy tones',
  'Classic',
  'Street',
  'Elegant',
  'Sporty',
  'Colorful',
] as const;
