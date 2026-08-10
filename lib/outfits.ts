import type { ClothingItem, Outfit } from '@/data/types';

/** Pinned first, then most recently updated. */
export function sortOutfits(outfits: Outfit[]): Outfit[] {
  return [...outfits].sort((a, b) => {
    const pinA = Boolean(a.isPinned);
    const pinB = Boolean(b.isPinned);
    if (pinA !== pinB) return pinA ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/** Match outfit name, occasion, or piece name/color/category. */
export function filterOutfits(
  outfits: Outfit[],
  query: string,
  getPieces: (outfit: Outfit) => ClothingItem[],
): Outfit[] {
  const q = query.trim().toLowerCase();
  if (!q) return outfits;

  return outfits.filter((outfit) => {
    const pieces = getPieces(outfit);
    const haystack = [
      outfit.name,
      outfit.occasion ?? '',
      ...pieces.flatMap((item) => [
        item.name,
        item.attributes.color,
        item.attributes.category,
        item.attributes.style,
      ]),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
