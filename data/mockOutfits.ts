import type { Outfit } from '@/data/types';

/** Demo outfits built from mock wardrobe item ids. */
export const mockOutfits: Outfit[] = [
  {
    id: 'outfit-1',
    name: 'Weekend brunch',
    occasion: 'Casual',
    itemIds: ['item-1', 'item-2', 'item-4', 'item-5'],
    createdAt: '2026-08-07T10:00:00Z',
    updatedAt: '2026-08-07T10:00:00Z',
  },
  {
    id: 'outfit-2',
    name: 'Smart casual Friday',
    occasion: 'Work',
    itemIds: ['item-7', 'item-2', 'item-4'],
    createdAt: '2026-08-08T09:00:00Z',
    updatedAt: '2026-08-08T09:00:00Z',
  },
];
