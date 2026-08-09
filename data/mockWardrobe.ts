import type { ClothingItem, UserProfile } from '@/data/types';

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
];

/** Simulated AI recognition result from an uploaded photo. */
export function mockAiIdentify(imageUri: string) {
  return {
    imageUri,
    suggestedName: 'Soft Cotton Blouse',
    confidence: 0.87,
    attributes: {
      category: 'Tops' as const,
      color: 'Ivory',
      pattern: 'Solid',
      material: 'Cotton',
      style: 'Relaxed',
      occasion: 'Casual',
    },
  };
}
