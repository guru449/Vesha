import type { Outfit } from '@/data/types';

/** Demo outfits built from mock wardrobe item ids. */
export const mockOutfits: Outfit[] = [
  {
    id: 'outfit-1',
    name: 'Weekend brunch',
    occasion: 'Casual',
    itemIds: ['item-1', 'item-2', 'item-13', 'item-5'],
    createdAt: '2026-08-07T10:00:00Z',
    updatedAt: '2026-08-07T10:00:00Z',
    lastWornAt: '2026-08-07T11:00:00Z',
    isPinned: true,
  },
  {
    id: 'outfit-2',
    name: 'Smart casual Friday',
    occasion: 'Work',
    itemIds: ['item-7', 'item-12', 'item-4'],
    createdAt: '2026-08-08T09:00:00Z',
    updatedAt: '2026-08-08T09:00:00Z',
    lastWornAt: '2026-08-08T09:30:00Z',
  },
  {
    id: 'outfit-3',
    name: 'Evening out',
    occasion: 'Evening',
    itemIds: ['item-9', 'item-14', 'item-5'],
    createdAt: '2026-08-09T19:00:00Z',
    updatedAt: '2026-08-09T19:00:00Z',
    isPinned: true,
  },
  {
    id: 'outfit-4',
    name: 'Hot day linen',
    occasion: 'Casual',
    itemIds: ['item-10', 'item-13', 'item-6'],
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'outfit-5',
    name: 'Travel day',
    occasion: 'Travel',
    itemIds: ['item-8', 'item-11', 'item-13', 'item-6'],
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
];
