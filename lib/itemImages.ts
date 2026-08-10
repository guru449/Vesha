import type { ClothingItem } from '@/data/types';

export const MAX_ITEM_PHOTOS = 6;

/** Cover + extras, de-duplicated, cover first. */
export function getItemImages(item: Pick<ClothingItem, 'imageUri' | 'imageUris'>): string[] {
  const cover = item.imageUri?.trim();
  const extras = (item.imageUris ?? []).map((uri) => uri.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const uri of [cover, ...extras].filter(Boolean) as string[]) {
    if (seen.has(uri)) continue;
    seen.add(uri);
    out.push(uri);
  }
  return out;
}

/** Ensure legacy items (cover only) have a synced imageUris array. */
export function normalizeClothingItem(item: ClothingItem): ClothingItem {
  const images = getItemImages(item);
  const cover = images[0] ?? item.imageUri;
  return {
    ...item,
    imageUri: cover,
    imageUris: images.length ? images : cover ? [cover] : [],
  };
}

export function withItemImages(
  item: ClothingItem,
  images: string[],
  coverUri?: string,
): ClothingItem {
  const cleaned = images.map((uri) => uri.trim()).filter(Boolean);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const uri of cleaned) {
    if (seen.has(uri)) continue;
    seen.add(uri);
    unique.push(uri);
  }
  if (!unique.length) return normalizeClothingItem(item);

  let ordered = unique;
  if (coverUri && unique.includes(coverUri)) {
    ordered = [coverUri, ...unique.filter((uri) => uri !== coverUri)];
  }
  return {
    ...item,
    imageUri: ordered[0],
    imageUris: ordered,
  };
}
