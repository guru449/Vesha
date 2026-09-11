import type { ClothingItem } from '@/data/types';

export type GroupMember = {
  id: string;
  name: string;
  role: 'you' | 'guest';
  /** Privacy-scoped closet subset for guests; empty means use signed-in closet */
  closetItemIds: string[];
  /** Soft color preferences for coordination */
  palettePrefs: string[];
};

export type GroupEvent = {
  id: string;
  title: string;
  vibe: string;
  dressCode: string;
  occasion: string;
  /** Target palette words for coordination */
  palette: string[];
  dateLabel: string;
  members: GroupMember[];
};

export const seedGroupEvents: GroupEvent[] = [
  {
    id: 'group-wedding',
    title: 'Family wedding weekend',
    vibe: 'Festive elegant',
    dressCode: 'Cocktail / festive',
    occasion: 'Evening',
    palette: ['emerald', 'gold', 'ivory', 'black', 'cream'],
    dateLabel: 'Sat · next week',
    members: [
      {
        id: 'you',
        name: 'You',
        role: 'you',
        closetItemIds: [],
        palettePrefs: ['emerald', 'gold', 'black'],
      },
      {
        id: 'm-sam',
        name: 'Sam',
        role: 'guest',
        closetItemIds: ['item-7', 'item-12', 'item-4', 'item-5'],
        palettePrefs: ['navy', 'black', 'gold'],
      },
      {
        id: 'm-riya',
        name: 'Riya',
        role: 'guest',
        closetItemIds: ['item-16', 'item-14', 'item-5'],
        palettePrefs: ['emerald', 'gold', 'nude'],
      },
    ],
  },
  {
    id: 'group-trip',
    title: 'Friends’ beach trip',
    vibe: 'Easy vacation',
    dressCode: 'Casual day · dinner smart-casual',
    occasion: 'Travel',
    palette: ['cream', 'white', 'olive', 'blue', 'natural'],
    dateLabel: 'Thu–Sun',
    members: [
      {
        id: 'you',
        name: 'You',
        role: 'you',
        closetItemIds: [],
        palettePrefs: ['cream', 'olive', 'white'],
      },
      {
        id: 'm-alex',
        name: 'Alex',
        role: 'guest',
        closetItemIds: ['item-1', 'item-11', 'item-13', 'item-6'],
        palettePrefs: ['blue', 'olive', 'white'],
      },
      {
        id: 'm-chen',
        name: 'Chen',
        role: 'guest',
        closetItemIds: ['item-10', 'item-13', 'item-6', 'item-5'],
        palettePrefs: ['white', 'cream', 'gold'],
      },
    ],
  },
];

export function resolveMemberCloset(
  member: GroupMember,
  yourCloset: ClothingItem[],
): ClothingItem[] {
  if (member.role === 'you' || member.closetItemIds.length === 0) {
    return yourCloset;
  }
  return member.closetItemIds
    .map((id) => yourCloset.find((item) => item.id === id))
    .filter(Boolean) as ClothingItem[];
}
