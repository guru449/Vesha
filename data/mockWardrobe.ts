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
    name: 'Sage Linen Shirt',
    imageUri:
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
    attributes: {
      category: 'Tops',
      color: 'Sage green',
      pattern: 'Solid',
      material: 'Linen',
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
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
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
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
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
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
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
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80',
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
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
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
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80',
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
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80',
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
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
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
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
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
    }
  | {
      matched: false;
      imageUri: string;
      confidence: number;
      reason: string;
    };

/**
 * Simulated AI recognition for Phase 1.
 * Pass forceNoMatch to exercise the "couldn't identify" happy path.
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
    suggestedName: 'Soft Cotton Blouse',
    confidence: 0.87,
    attributes: {
      category: 'Tops',
      color: 'Ivory',
      pattern: 'Solid',
      material: 'Cotton',
      style: 'Relaxed',
      occasion: 'Casual',
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
