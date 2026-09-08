import type { ClothingCategory } from '@/constants/theme';
import type { ClothingItem } from '@/data/types';
import { matchesSearch } from '@/lib/search';
import { colorsWorkTogether } from '@/lib/wardrobeHealth';

export type ClosetSearchMode = 'specific' | 'occasion' | 'combo';

export type ClosetSearchResult = {
  mode: ClosetSearchMode;
  /** Human label for the result header */
  headline: string;
  items: ClothingItem[];
  /** Seed item when mode is combo */
  seedItem?: ClothingItem;
};

const OCCASION_CUES: { cue: RegExp; occasion: string; label: string }[] = [
  { cue: /\bwedding\b|\breception\b|\bsangeet\b/i, occasion: 'evening', label: 'wedding' },
  { cue: /\bdate\b|\bdinner\b|\bevening\b/i, occasion: 'evening', label: 'evening / date' },
  { cue: /\bwork\b|\boffice\b|\bmeeting\b|\binterview\b/i, occasion: 'work', label: 'work' },
  { cue: /\bbrunch\b/i, occasion: 'brunch', label: 'brunch' },
  { cue: /\btravel\b|\bflight\b|\bairport\b/i, occasion: 'travel', label: 'travel' },
  { cue: /\bcasual\b|\bweekend\b|\beveryday\b/i, occasion: 'casual', label: 'casual' },
  { cue: /\bparty\b|\bfestive\b|\bfestival\b|\bdiwali\b/i, occasion: 'evening', label: 'party / festive' },
  { cue: /\bgym\b|\brun\b|\bworkout\b/i, occasion: 'sport', label: 'active' },
];

const INTENT_PREFIX =
  /^(what\s+can\s+i\s+wear|what\s+to\s+wear|outfit\s+for|wear\s+for|ideas?\s+for|looks?\s+for)\b/i;

const COMBO_PREFIX =
  /^(what\s+goes\s+with|goes\s+with|pair\s+with|match\s+with|style\s+with)\b/i;

function occasionCompatible(a: string, b: string): boolean {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (!na || !nb || na === 'unknown' || nb === 'unknown') return true;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const casual = ['casual', 'everyday', 'brunch', 'travel'];
  const smart = ['work', 'smart', 'evening', 'party'];
  const aCasual = casual.some((x) => na.includes(x));
  const bCasual = casual.some((x) => nb.includes(x));
  const aSmart = smart.some((x) => na.includes(x));
  const bSmart = smart.some((x) => nb.includes(x));
  if (aCasual && bCasual) return true;
  if (aSmart && bSmart) return true;
  if (na.includes('everyday') || nb.includes('everyday')) return true;
  return false;
}

function complementaryCategories(category: ClothingCategory): ClothingCategory[] {
  switch (category) {
    case 'Tops':
      return ['Bottoms', 'Shoes', 'Accessories', 'Jewelry'];
    case 'Bottoms':
      return ['Tops', 'Shoes', 'Accessories', 'Jewelry'];
    case 'Dresses':
      return ['Shoes', 'Jewelry', 'Accessories'];
    case 'Shoes':
      return ['Tops', 'Bottoms', 'Dresses', 'Accessories'];
    case 'Jewelry':
    case 'Accessories':
      return ['Tops', 'Bottoms', 'Dresses', 'Shoes'];
    default:
      return ['Tops', 'Bottoms', 'Shoes'];
  }
}

function scorePairing(seed: ClothingItem, candidate: ClothingItem): number {
  let score = 0;
  if (colorsWorkTogether(seed.attributes.color, candidate.attributes.color)) {
    score += 4;
  } else {
    score -= 6;
  }
  if (
    occasionCompatible(seed.attributes.occasion, candidate.attributes.occasion)
  ) {
    score += 3;
  }
  const seedStyle = seed.attributes.style.toLowerCase();
  const candStyle = candidate.attributes.style.toLowerCase();
  if (seedStyle && candStyle && (seedStyle.includes(candStyle) || candStyle.includes(seedStyle))) {
    score += 2;
  }
  // Prefer finishing pieces when seed is a hero garment
  if (seed.attributes.category === 'Tops' && candidate.attributes.category === 'Bottoms') {
    score += 2;
  }
  if (seed.attributes.category === 'Bottoms' && candidate.attributes.category === 'Tops') {
    score += 2;
  }
  if (candidate.attributes.category === 'Shoes') score += 1;
  return score;
}

function findSeedByQuery(
  items: ClothingItem[],
  remainder: string,
): ClothingItem | undefined {
  const q = remainder.trim().toLowerCase().replace(/^(my|the|a|an)\s+/, '');
  if (!q) return undefined;

  const scored = items
    .map((item) => {
      const hay = [
        item.name,
        item.attributes.color,
        item.attributes.category,
        item.attributes.style,
      ]
        .join(' ')
        .toLowerCase();
      let score = 0;
      if (hay === q) score = 100;
      else if (hay.includes(q)) score = 50 + q.length;
      else if (matchesSearch([item.name, item.attributes.color, item.attributes.category], q)) {
        score = 20;
      }
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.item;
}

/**
 * Pair complementary pieces from the user's closet with a seed item.
 */
export function findPairingsForItem(
  seed: ClothingItem,
  closet: ClothingItem[],
  limit = 6,
): ClothingItem[] {
  const allowed = new Set(complementaryCategories(seed.attributes.category));
  return closet
    .filter((item) => item.id !== seed.id)
    .filter((item) => allowed.has(item.attributes.category))
    .map((item) => ({ item, score: scorePairing(seed, item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
}

/**
 * Build a small look (item ids) centered on a seed using closet pairings.
 */
export function buildLookAroundItem(
  seed: ClothingItem,
  closet: ClothingItem[],
): string[] {
  const pairings = findPairingsForItem(seed, closet, 8);
  const ids = [seed.id];
  const usedCategories = new Set<ClothingCategory>([seed.attributes.category]);

  for (const piece of pairings) {
    if (usedCategories.has(piece.attributes.category)) continue;
    // Dresses don't need tops/bottoms
    if (
      seed.attributes.category === 'Dresses' &&
      (piece.attributes.category === 'Tops' ||
        piece.attributes.category === 'Bottoms')
    ) {
      continue;
    }
    ids.push(piece.id);
    usedCategories.add(piece.attributes.category);
    if (ids.length >= 4) break;
  }
  return ids;
}

function filterOccasionPieces(
  items: ClothingItem[],
  occasionKey: string,
): ClothingItem[] {
  const key = occasionKey.toLowerCase();
  return items
    .map((item) => {
      const occ = item.attributes.occasion.toLowerCase();
      const style = item.attributes.style.toLowerCase();
      const name = item.name.toLowerCase();
      let score = 0;
      if (occ.includes(key)) score += 5;
      if (key === 'evening' && /elegant|dressy|party|gold|midi|heel/.test(`${occ} ${style} ${name}`)) {
        score += 3;
      }
      if (key === 'work' && /work|smart|office|trouser|blazer|crew/.test(`${occ} ${style} ${name}`)) {
        score += 3;
      }
      if (key === 'casual' && /casual|everyday|weekend|denim|tee/.test(`${occ} ${style} ${name}`)) {
        score += 2;
      }
      if (key === 'brunch' && /brunch|casual|linen|cream/.test(`${occ} ${style} ${name}`)) {
        score += 2;
      }
      if (key === 'travel' && /travel|casual|sneaker|jogger/.test(`${occ} ${style} ${name}`)) {
        score += 2;
      }
      if (occ.includes('everyday')) score += 1;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}

/**
 * Closet search: specific keywords, occasion intent, or “goes with …”.
 * Always returns individual pieces (not full outfits).
 */
export function searchClosetItems(
  items: ClothingItem[],
  query: string,
): ClosetSearchResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return { mode: 'specific', headline: '', items };
  }

  if (COMBO_PREFIX.test(trimmed)) {
    const remainder = trimmed.replace(COMBO_PREFIX, '').trim();
    const seed = findSeedByQuery(items, remainder);
    if (seed) {
      const paired = findPairingsForItem(seed, items, 12);
      return {
        mode: 'combo',
        headline: `Goes with ${seed.name}`,
        items: paired,
        seedItem: seed,
      };
    }
    return {
      mode: 'combo',
      headline: `Couldn’t find “${remainder}” in your closet`,
      items: [],
    };
  }

  const intentMatch = INTENT_PREFIX.test(trimmed);
  const occasionHit = OCCASION_CUES.find((row) => row.cue.test(trimmed));
  if (intentMatch || occasionHit) {
    const hit =
      occasionHit ||
      OCCASION_CUES.find((row) => row.cue.test(trimmed)) ||
      OCCASION_CUES[5]!;
    const pieces = filterOccasionPieces(items, hit.occasion);
    return {
      mode: 'occasion',
      headline: `Pieces for ${hit.label}`,
      items: pieces,
    };
  }

  // Bare occasion words without prefix still count as intent.
  const bare = OCCASION_CUES.find((row) => row.cue.test(trimmed));
  if (bare && tokenizeCount(trimmed) <= 3) {
    return {
      mode: 'occasion',
      headline: `Pieces for ${bare.label}`,
      items: filterOccasionPieces(items, bare.occasion),
    };
  }

  const filtered = items.filter((item) =>
    matchesSearch(
      [
        item.name,
        item.attributes.color,
        item.attributes.style,
        item.attributes.material,
        item.attributes.occasion,
        item.attributes.category,
        item.attributes.pattern,
        item.attributes.brand ?? '',
      ],
      trimmed,
    ),
  );

  return {
    mode: 'specific',
    headline: filtered.length ? `Matches for “${trimmed}”` : `No matches for “${trimmed}”`,
    items: filtered,
  };
}

function tokenizeCount(query: string): number {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter(Boolean).length;
}
