import type { ClothingCategory } from '@/constants/theme';
import type { ClothingItem } from '@/data/types';

export type AvatarLayerSlot =
  | 'dress'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'accessory'
  | 'jewelry';

export type AvatarLayer = {
  slot: AvatarLayerSlot;
  item: ClothingItem;
  zIndex: number;
};

const SLOT_ORDER: Record<AvatarLayerSlot, number> = {
  shoes: 1,
  bottom: 2,
  dress: 3,
  top: 4,
  accessory: 5,
  jewelry: 6,
};

function categoryToSlot(category: ClothingCategory): AvatarLayerSlot | null {
  switch (category) {
    case 'Dresses':
      return 'dress';
    case 'Tops':
      return 'top';
    case 'Bottoms':
      return 'bottom';
    case 'Shoes':
      return 'shoes';
    case 'Accessories':
      return 'accessory';
    case 'Jewelry':
      return 'jewelry';
    default:
      return null;
  }
}

/**
 * Map outfit pieces into avatar layers (one item per slot).
 * Dresses replace top+bottom visually.
 */
export function buildAvatarLayers(pieces: ClothingItem[]): AvatarLayer[] {
  const bySlot = new Map<AvatarLayerSlot, ClothingItem>();

  for (const item of pieces) {
    const slot = categoryToSlot(item.attributes.category);
    if (!slot) continue;
    if (!bySlot.has(slot)) {
      bySlot.set(slot, item);
    }
  }

  const hasDress = bySlot.has('dress');
  const layers: AvatarLayer[] = [];

  for (const [slot, item] of bySlot) {
    if (hasDress && (slot === 'top' || slot === 'bottom')) continue;
    layers.push({
      slot,
      item,
      zIndex: SLOT_ORDER[slot],
    });
  }

  return layers.sort((a, b) => a.zIndex - b.zIndex);
}

/** Soft height scale for silhouette proportions (0.92–1.08). */
export function heightScale(heightCm?: number): number {
  if (!heightCm || heightCm < 140 || heightCm > 200) return 1;
  return Math.min(1.08, Math.max(0.92, heightCm / 168));
}
