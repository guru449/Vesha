import type { ClothingItem, WearHistoryEntry } from '@/data/types';

/**
 * Closet view helpers: group pieces into wardrobe compartments and sort
 * each rail (by color spectrum, newest, or most worn).
 */

export type ClosetSortMode = 'color' | 'recent' | 'worn';

export const closetSortModes: { key: ClosetSortMode; label: string }[] = [
  { key: 'color', label: 'Color' },
  { key: 'recent', label: 'Recent' },
  { key: 'worn', label: 'Most worn' },
];

export type ClosetSections = {
  tops: ClothingItem[];
  bottoms: ClothingItem[];
  footwear: ClothingItem[];
  dresses: ClothingItem[];
  extras: ClothingItem[];
};

/**
 * Color families ordered the way a stylist hangs a rail: light → warm → cool → dark.
 * Each entry: [family rank, swatch hex, matching color words].
 */
const COLOR_SPECTRUM: { rank: number; hex: string; words: string[] }[] = [
  { rank: 0, hex: '#F7F5EF', words: ['white', 'off-white', 'snow'] },
  { rank: 1, hex: '#EDE4D0', words: ['cream', 'ivory', 'ecru', 'natural', 'oat'] },
  { rank: 2, hex: '#E6C9A8', words: ['beige', 'nude', 'sand', 'tan', 'camel', 'khaki'] },
  { rank: 3, hex: '#E5C34A', words: ['yellow', 'gold', 'mustard', 'lemon', 'butter'] },
  { rank: 4, hex: '#E0824A', words: ['orange', 'coral', 'peach', 'apricot', 'terracotta', 'rust'] },
  { rank: 5, hex: '#9A5B36', words: ['brown', 'cognac', 'chocolate', 'taupe', 'mocha', 'coffee', 'espresso'] },
  { rank: 6, hex: '#C8434A', words: ['red', 'crimson', 'cherry', 'scarlet', 'burgundy', 'maroon', 'wine'] },
  { rank: 7, hex: '#D98AA0', words: ['pink', 'rose', 'dusty rose', 'blush', 'fuchsia', 'magenta', 'hot pink'] },
  { rank: 8, hex: '#8E5FA8', words: ['purple', 'violet', 'lavender', 'lilac', 'plum', 'mauve'] },
  { rank: 9, hex: '#4E8E6C', words: ['green', 'sage', 'olive', 'mint', 'emerald', 'forest', 'khaki green'] },
  { rank: 10, hex: '#3E8E9A', words: ['teal', 'aqua', 'turquoise'] },
  { rank: 11, hex: '#9DC3E6', words: ['light blue', 'sky', 'baby blue', 'powder blue'] },
  { rank: 12, hex: '#3F63B0', words: ['blue', 'cobalt', 'royal', 'denim'] },
  { rank: 13, hex: '#2F3F7A', words: ['indigo'] },
  { rank: 14, hex: '#1F2A44', words: ['navy', 'midnight'] },
  { rank: 15, hex: '#9A9A9A', words: ['gray', 'grey', 'silver', 'slate', 'heather', 'stone'] },
  { rank: 16, hex: '#3A3A3A', words: ['charcoal'] },
  { rank: 17, hex: '#0E0E0E', words: ['black', 'ebony', 'jet'] },
];

const UNKNOWN_RANK = 99;
const UNKNOWN_HEX = '#6E736F';

function resolveColor(color: string): { rank: number; hex: string } {
  const c = color.trim().toLowerCase();
  if (!c) return { rank: UNKNOWN_RANK, hex: UNKNOWN_HEX };

  // Prefer the most specific (longest) matching word so "light blue" wins over "blue".
  let best: { rank: number; hex: string; len: number } | null = null;
  for (const entry of COLOR_SPECTRUM) {
    for (const word of entry.words) {
      if (c === word || c.includes(word)) {
        if (!best || word.length > best.len) {
          best = { rank: entry.rank, hex: entry.hex, len: word.length };
        }
      }
    }
  }
  return best ?? { rank: UNKNOWN_RANK, hex: UNKNOWN_HEX };
}

/** Position on the light → dark rail; unknown colors go last. */
export function colorRank(color: string): number {
  return resolveColor(color).rank;
}

/** Small swatch to hint the color order under each hanger. */
export function colorSwatchHex(color: string): string {
  return resolveColor(color).hex;
}

function timeOf(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function countWears(
  wearHistory: WearHistoryEntry[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of wearHistory) {
    for (const id of entry.itemIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

export function sortClosetItems(
  items: ClothingItem[],
  mode: ClosetSortMode,
  wearCounts?: Map<string, number>,
): ClothingItem[] {
  const list = [...items];
  if (mode === 'color') {
    return list.sort((a, b) => {
      const diff = colorRank(a.attributes.color) - colorRank(b.attributes.color);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }
  if (mode === 'recent') {
    return list.sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
  }
  return list.sort((a, b) => {
    const wa = wearCounts?.get(a.id) ?? 0;
    const wb = wearCounts?.get(b.id) ?? 0;
    if (wb !== wa) return wb - wa;
    return timeOf(b.lastWornAt) - timeOf(a.lastWornAt);
  });
}

/** Split pieces into the wardrobe compartments shown on the Closet tab. */
export function groupClosetSections(items: ClothingItem[]): ClosetSections {
  const sections: ClosetSections = {
    tops: [],
    bottoms: [],
    footwear: [],
    dresses: [],
    extras: [],
  };
  for (const item of items) {
    switch (item.attributes.category) {
      case 'Tops':
        sections.tops.push(item);
        break;
      case 'Bottoms':
        sections.bottoms.push(item);
        break;
      case 'Shoes':
        sections.footwear.push(item);
        break;
      case 'Dresses':
        sections.dresses.push(item);
        break;
      default:
        sections.extras.push(item);
    }
  }
  return sections;
}

export function sortClosetSections(
  sections: ClosetSections,
  mode: ClosetSortMode,
  wearCounts?: Map<string, number>,
): ClosetSections {
  return {
    tops: sortClosetItems(sections.tops, mode, wearCounts),
    bottoms: sortClosetItems(sections.bottoms, mode, wearCounts),
    footwear: sortClosetItems(sections.footwear, mode, wearCounts),
    dresses: sortClosetItems(sections.dresses, mode, wearCounts),
    extras: sortClosetItems(sections.extras, mode, wearCounts),
  };
}
