import type { Outfit } from '@/data/types';

/** Pinned first, then most recently updated. */
export function sortOutfits(outfits: Outfit[]): Outfit[] {
  return [...outfits].sort((a, b) => {
    const pinA = Boolean(a.isPinned);
    const pinB = Boolean(b.isPinned);
    if (pinA !== pinB) return pinA ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
