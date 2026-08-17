import type { ClothingAttributes, ClothingItem, UserProfile } from '@/data/types';

export const demoUser: UserProfile = {
  id: 'user-1',
  name: 'Ava Chen',
  email: 'ava@vesha.app',
  heightCm: 168,
  weightKg: 58,
  stylePreferences: ['Minimal', 'Smart casual', 'Earthy tones'],
};

export const mockWardrobe: ClothingItem[] = [
  {
    id: 'item-1',
    name: 'Chambray Button Shirt',
    imageUri:
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80',
    attributes: {
      category: 'Tops',
      color: 'Light blue',
      pattern: 'Solid',
      material: 'Cotton',
      style: 'Relaxed',
      occasion: 'Casual',
      brand: 'Everlane',
    },
    createdAt: '2026-08-01T10:00:00Z',
    aiConfidence: 0.94,
  },
  {
    id: 'item-2',
    name: 'Cream Wide Trousers',
    imageUri:
      'https://images.unsplash.com/photo-1632282005753-29f80ed13c93?w=600&q=80',
    attributes: {
      category: 'Bottoms',
      color: 'Cream',
      pattern: 'Solid',
      material: 'Cotton blend',
      style: 'Wide-leg',
      occasion: 'Smart casual',
    },
    createdAt: '2026-08-02T11:00:00Z',
    aiConfidence: 0.91,
  },
  {
    id: 'item-3',
    name: 'Soft Knit Dress',
    imageUri:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
    attributes: {
      category: 'Dresses',
      color: 'Dusty rose',
      pattern: 'Solid',
      material: 'Knit',
      style: 'Midi',
      occasion: 'Brunch',
    },
    createdAt: '2026-08-03T09:30:00Z',
    aiConfidence: 0.88,
  },
  {
    id: 'item-4',
    name: 'Leather Ankle Boots',
    imageUri:
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80',
    attributes: {
      category: 'Shoes',
      color: 'Cognac',
      pattern: 'Solid',
      material: 'Leather',
      style: 'Ankle boot',
      occasion: 'Everyday',
    },
    createdAt: '2026-08-04T14:00:00Z',
    aiConfidence: 0.96,
  },
  {
    id: 'item-5',
    name: 'Gold Hoop Earrings',
    imageUri:
      'https://images.unsplash.com/photo-1684439673104-f5d22791c71a?w=600&q=80',
    attributes: {
      category: 'Jewelry',
      color: 'Gold',
      pattern: 'Solid',
      material: 'Gold-plated',
      style: 'Hoop',
      occasion: 'Everyday',
    },
    createdAt: '2026-08-05T16:00:00Z',
    aiConfidence: 0.9,
  },
  {
    id: 'item-6',
    name: 'Canvas Tote',
    imageUri:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
    attributes: {
      category: 'Accessories',
      color: 'Natural',
      pattern: 'Solid',
      material: 'Canvas',
      style: 'Tote',
      occasion: 'Casual',
    },
    createdAt: '2026-08-06T12:00:00Z',
    aiConfidence: 0.93,
  },
  {
    id: 'item-7',
    name: 'Navy Crew Sweater',
    imageUri:
      'https://images.unsplash.com/photo-1611312449545-94176309c857?w=600&q=80',
    attributes: {
      category: 'Tops',
      color: 'Navy',
      pattern: 'Solid',
      material: 'Wool blend',
      style: 'Crewneck',
      occasion: 'Work',
    },
    createdAt: '2026-08-07T08:00:00Z',
    aiConfidence: 0.92,
  },
  {
    id: 'item-8',
    name: 'Denim Jacket',
    imageUri:
      'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=600&q=80',
    attributes: {
      category: 'Tops',
      color: 'Indigo',
      pattern: 'Solid',
      material: 'Denim',
      style: 'Classic',
      occasion: 'Casual',
    },
    createdAt: '2026-08-08T10:00:00Z',
    aiConfidence: 0.95,
  },
  {
    id: 'item-9',
    name: 'Black Slip Dress',
    imageUri:
      'https://images.unsplash.com/photo-1770294759013-a5784266a817?w=600&q=80',
    attributes: {
      category: 'Dresses',
      color: 'Black',
      pattern: 'Solid',
      material: 'Silk',
      style: 'Slip',
      occasion: 'Evening',
    },
    createdAt: '2026-08-09T11:00:00Z',
    aiConfidence: 0.93,
  },
  {
    id: 'item-10',
    name: 'White Linen Midi Dress',
    imageUri:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80',
    attributes: {
      category: 'Dresses',
      color: 'White',
      pattern: 'Solid',
      material: 'Linen',
      style: 'Midi',
      occasion: 'Casual',
    },
    createdAt: '2026-08-09T12:00:00Z',
    aiConfidence: 0.91,
  },
  {
    id: 'item-11',
    name: 'Olive Travel Pants',
    imageUri:
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
    attributes: {
      category: 'Bottoms',
      color: 'Olive',
      pattern: 'Solid',
      material: 'Cotton',
      style: 'Relaxed',
      occasion: 'Travel',
    },
    createdAt: '2026-08-09T13:00:00Z',
    aiConfidence: 0.9,
  },
  {
    id: 'item-12',
    name: 'Black Tailored Trousers',
    imageUri:
      'https://images.unsplash.com/photo-1776267338689-e9a8a2f36799?w=600&q=80',
    attributes: {
      category: 'Bottoms',
      color: 'Black',
      pattern: 'Solid',
      material: 'Wool blend',
      style: 'Tailored',
      occasion: 'Work',
    },
    createdAt: '2026-08-09T14:00:00Z',
    aiConfidence: 0.94,
  },
  {
    id: 'item-13',
    name: 'White Leather Sneakers',
    imageUri:
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80',
    attributes: {
      category: 'Shoes',
      color: 'White',
      pattern: 'Solid',
      material: 'Leather',
      style: 'Sneaker',
      occasion: 'Casual',
    },
    createdAt: '2026-08-09T15:00:00Z',
    aiConfidence: 0.95,
  },
  {
    id: 'item-14',
    name: 'Strappy Heeled Sandals',
    imageUri:
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80',
    attributes: {
      category: 'Shoes',
      color: 'Nude',
      pattern: 'Solid',
      material: 'Leather',
      style: 'Sandals',
      occasion: 'Evening',
    },
    createdAt: '2026-08-09T16:00:00Z',
    aiConfidence: 0.89,
  },
  {
    id: 'item-15',
    name: 'Ivory Silk Blouse',
    imageUri:
      'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80',
    attributes: {
      category: 'Tops',
      color: 'Ivory',
      pattern: 'Solid',
      material: 'Silk',
      style: 'Blouse',
      occasion: 'Work',
    },
    createdAt: '2026-08-09T17:00:00Z',
    aiConfidence: 0.92,
  },
  {
    id: 'item-16',
    name: 'Emerald Wrap Dress',
    imageUri:
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
    attributes: {
      category: 'Dresses',
      color: 'Emerald green',
      pattern: 'Solid',
      material: 'Jersey',
      style: 'Wrap',
      occasion: 'Evening',
    },
    createdAt: '2026-08-09T18:00:00Z',
    aiConfidence: 0.9,
  },
];

export type AiIdentifyResult =
  | {
      matched: true;
      imageUri: string;
      suggestedName: string;
      confidence: number;
      attributes: ClothingAttributes;
      /**
       * Local color-only heuristic: color may be OK, but garment type
       * was not inferred — user must pick category before trusting the name.
       */
      needsCategory?: boolean;
    }
  | {
      matched: false;
      imageUri: string;
      confidence: number;
      reason: string;
    };

/**
 * Sync mock for the forced "no match" QA path.
 * Matched demos use heuristicIdentifyFromImage (color only).
 */
export function mockAiIdentify(
  imageUri: string,
  options?: { forceNoMatch?: boolean },
): AiIdentifyResult {
  if (options?.forceNoMatch) {
    return {
      matched: false,
      imageUri,
      confidence: 0.28,
      reason:
        'No clear clothing item was detected. You can still add this photo to your wardrobe.',
    };
  }

  return {
    matched: true,
    imageUri,
    suggestedName: 'New piece',
    confidence: 0.45,
    needsCategory: true,
    attributes: {
      category: 'Tops',
      color: 'Unknown',
      pattern: 'Solid',
      material: 'Unknown',
      style: 'Unknown',
      occasion: 'Everyday',
    },
  };
}

export const emptyManualAttributes: ClothingAttributes = {
  category: 'Tops',
  color: 'Unknown',
  pattern: 'Unknown',
  material: 'Unknown',
  style: 'Unknown',
  occasion: 'Everyday',
};
