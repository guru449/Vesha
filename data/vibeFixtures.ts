import type { ClothingCategory } from '@/constants/theme';

export type VibeElementRole =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'accessory'
  | 'jewelry';

export type VibeElementSpec = {
  role: VibeElementRole;
  /** What the inspiration is wearing */
  label: string;
  category: ClothingCategory;
  /** Strong tokens — a hit here counts as an exact closet match */
  exactKeywords: string[];
  /** Softer tokens used for silhouette-hack scoring */
  keywords: string[];
  /** Copy when an exact match is missing */
  silhouetteHack: string;
  /** Soft roles can be omitted without failing the look */
  optional?: boolean;
};

export type VibeFixture = {
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  vibeLabels: string[];
  elements: VibeElementSpec[];
};

/**
 * Demo inspirations for Vibe Match MVP (no vision required).
 * Acceptance fixture: baggy tee + jeans + cap (+ sneakers).
 */
export const vibeFixtures: VibeFixture[] = [
  {
    id: 'street-baggy',
    title: 'Street easy',
    subtitle: 'Baggy tee · jeans · cap · sneakers',
    imageUri:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    vibeLabels: ['street', 'relaxed', 'casual', 'oversized'],
    elements: [
      {
        role: 'top',
        label: 'Baggy tee',
        category: 'Tops',
        exactKeywords: ['baggy', 'oversized', 'tee', 't-shirt', 'tshirt'],
        keywords: ['shirt', 'relaxed', 'crew', 'classic', 'denim'],
        silhouetteHack: 'Oversized shirt ≈ baggy tee',
      },
      {
        role: 'bottom',
        label: 'Relaxed jeans',
        category: 'Bottoms',
        exactKeywords: ['jean', 'denim'],
        keywords: ['relaxed', 'wide', 'trouser', 'pant', 'travel'],
        silhouetteHack: 'Relaxed trousers ≈ jeans',
      },
      {
        role: 'accessory',
        label: 'Cap',
        category: 'Accessories',
        exactKeywords: ['cap', 'hat', 'beanie'],
        keywords: ['tote', 'bag', 'accessory'],
        silhouetteHack: 'Skip the cap — or finish with a simple tote',
        optional: true,
      },
      {
        role: 'shoes',
        label: 'Sneakers',
        category: 'Shoes',
        exactKeywords: ['sneaker', 'trainer'],
        keywords: ['white', 'casual', 'leather'],
        silhouetteHack: 'Clean sneakers or casual shoes',
      },
    ],
  },
  {
    id: 'smart-work',
    title: 'Soft workday',
    subtitle: 'Blouse · tailored trousers · boots',
    imageUri:
      'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80',
    vibeLabels: ['work', 'smart', 'polished'],
    elements: [
      {
        role: 'top',
        label: 'Silk blouse',
        category: 'Tops',
        exactKeywords: ['blouse', 'silk'],
        keywords: ['ivory', 'cream', 'crew', 'sweater'],
        silhouetteHack: 'Crew sweater ≈ soft blouse',
      },
      {
        role: 'bottom',
        label: 'Tailored trousers',
        category: 'Bottoms',
        exactKeywords: ['tailored', 'trouser'],
        keywords: ['black', 'wool', 'wide'],
        silhouetteHack: 'Wide trousers ≈ tailored pants',
      },
      {
        role: 'shoes',
        label: 'Ankle boots',
        category: 'Shoes',
        exactKeywords: ['boot', 'ankle'],
        keywords: ['leather', 'cognac'],
        silhouetteHack: 'Ankle boots or polished flats',
      },
      {
        role: 'jewelry',
        label: 'Gold hoops',
        category: 'Jewelry',
        exactKeywords: ['hoop', 'earring'],
        keywords: ['gold'],
        silhouetteHack: 'Simple gold jewelry',
        optional: true,
      },
    ],
  },
  {
    id: 'evening-slip',
    title: 'Date-night slip',
    subtitle: 'Slip dress · heels · gold',
    imageUri:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    vibeLabels: ['evening', 'elegant', 'date'],
    elements: [
      {
        role: 'dress',
        label: 'Slip dress',
        category: 'Dresses',
        exactKeywords: ['slip', 'silk'],
        keywords: ['dress', 'black', 'midi', 'wrap'],
        silhouetteHack: 'Midi or wrap dress ≈ slip silhouette',
      },
      {
        role: 'shoes',
        label: 'Heeled sandals',
        category: 'Shoes',
        exactKeywords: ['heel', 'sandal', 'strappy'],
        keywords: ['nude', 'evening'],
        silhouetteHack: 'Heeled sandals or dressy shoes',
      },
      {
        role: 'jewelry',
        label: 'Gold earrings',
        category: 'Jewelry',
        exactKeywords: ['earring', 'hoop'],
        keywords: ['gold'],
        silhouetteHack: 'One gold accent is enough',
        optional: true,
      },
    ],
  },
];

export function getVibeFixture(id: string): VibeFixture | undefined {
  return vibeFixtures.find((row) => row.id === id);
}

/** Fallback template when the user uploads a custom inspiration photo. */
export const uploadStreetTemplate: VibeFixture = {
  id: 'upload-street',
  title: 'Your inspiration',
  subtitle: 'Street silhouette from your photo',
  imageUri: '',
  vibeLabels: ['street', 'casual', 'inspired'],
  elements: vibeFixtures[0]!.elements,
};
