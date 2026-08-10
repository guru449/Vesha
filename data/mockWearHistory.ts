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
  {
    id: 'wear-3',
    outfitId: 'outfit-2',
    outfitName: 'Smart casual Friday',
    itemIds: ['item-7', 'item-2', 'item-4'],
    wornAt: '2026-08-01T09:00:00Z',
    occasion: 'Work',
  },
  {
    id: 'wear-4',
    outfitId: 'outfit-1',
    outfitName: 'Weekend brunch',
    itemIds: ['item-1', 'item-2', 'item-4'],
    wornAt: '2026-07-26T12:00:00Z',
    occasion: 'Casual',
  },
  {
    id: 'wear-5',
    outfitId: 'outfit-legacy',
    outfitName: 'Spring stroll',
    itemIds: ['item-8', 'item-2'],
    wornAt: '2026-04-12T14:00:00Z',
    occasion: 'Casual',
  },
];
