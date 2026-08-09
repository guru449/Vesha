import type { WearHistoryEntry } from '@/data/types';

export const mockWearHistory: WearHistoryEntry[] = [
  {
    id: 'wear-1',
    outfitId: 'outfit-2',
    outfitName: 'Smart casual Friday',
    itemIds: ['item-7', 'item-2', 'item-4'],
    wornAt: '2026-08-08T09:30:00Z',
    occasion: 'Work',
  },
  {
    id: 'wear-2',
    outfitId: 'outfit-1',
    outfitName: 'Weekend brunch',
    itemIds: ['item-1', 'item-2', 'item-4', 'item-5'],
    wornAt: '2026-08-07T11:00:00Z',
    occasion: 'Casual',
  },
];
