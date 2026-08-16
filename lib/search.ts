/**
 * Shared wardrobe/outfit search helpers.
 * Token AND-match + light color/category synonym expansion (no vision).
 */

/** Color families: tagged shades map to everyday query words. */
const COLOR_FAMILIES: Record<string, string[]> = {
  red: [
    'red',
    'rose',
    'dusty rose',
    'crimson',
    'burgundy',
    'maroon',
    'cherry',
    'wine',
    'scarlet',
  ],
  pink: ['pink', 'blush', 'fuchsia', 'magenta', 'hot pink'],
  blue: ['blue', 'navy', 'indigo', 'cobalt', 'sky', 'teal', 'aqua'],
  green: ['green', 'sage', 'olive', 'mint', 'emerald', 'forest'],
  yellow: ['yellow', 'gold', 'mustard', 'lemon'],
  orange: ['orange', 'cognac', 'terracotta', 'rust', 'coral'],
  brown: ['brown', 'tan', 'beige', 'camel', 'chocolate', 'taupe'],
  cream: ['cream', 'ivory', 'off-white', 'ecru', 'natural'],
  white: ['white', 'ivory', 'cream'],
  black: ['black', 'charcoal', 'ebony'],
  gray: ['gray', 'grey', 'silver', 'slate', 'heather'],
};

const CATEGORY_EXTRAS: Record<string, string[]> = {
  dresses: ['dress', 'dresses', 'gown'],
  tops: ['top', 'tops', 'shirt', 'blouse', 'tee', 'sweater'],
  bottoms: ['bottom', 'bottoms', 'pants', 'trousers', 'jeans', 'skirt'],
  shoes: ['shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sandal'],
  jewelry: ['jewelry', 'jewellery', 'earring', 'earrings', 'necklace', 'ring'],
  accessories: ['accessory', 'accessories', 'bag', 'tote', 'belt', 'hat'],
};

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Extra searchable terms implied by a color string. */
export function colorSearchExtras(color: string): string[] {
  const c = color.toLowerCase();
  if (!c) return [];
  const extras: string[] = [];
  for (const [family, members] of Object.entries(COLOR_FAMILIES)) {
    const hitsFamily =
      c.includes(family) || members.some((member) => c.includes(member));
    if (hitsFamily) {
      extras.push(family, ...members);
    }
  }
  return unique(extras);
}

/** Extra searchable terms implied by a category label. */
export function categorySearchExtras(category: string): string[] {
  const key = category.toLowerCase();
  return unique([key, ...(CATEGORY_EXTRAS[key] ?? [])]);
}

/** Build an expanded haystack from raw text fields. */
export function buildSearchHaystack(parts: string[]): string {
  const base = parts.filter(Boolean).join(' ').toLowerCase();
  const extras: string[] = [];
  for (const part of parts) {
    extras.push(...colorSearchExtras(part));
    extras.push(...categorySearchExtras(part));
  }
  return unique([base, ...extras]).join(' ');
}

/**
 * True when every query token matches the haystack
 * (substring), after synonym expansion on the document side.
 */
export function matchesSearch(haystackParts: string[], query: string): boolean {
  const tokens = tokenize(query);
  if (!tokens.length) return true;

  const haystack = buildSearchHaystack(haystackParts);
  return tokens.every((token) => haystack.includes(token));
}
