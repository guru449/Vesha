import type { ClothingCategory } from '@/constants/theme';

export type ClothingAttributes = {
  category: ClothingCategory;
  color: string;
  pattern: string;
  material: string;
  style: string;
  occasion: string;
  brand?: string;
};

export type ClothingItem = {
  id: string;
  name: string;
  imageUri: string;
  attributes: ClothingAttributes;
  notes?: string;
  createdAt: string;
  aiConfidence?: number;
  /** Updated when worn alone or as part of an outfit */
  lastWornAt?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  heightCm?: number;
  weightKg?: number;
  stylePreferences: string[];
};

export type Outfit = {
  id: string;
  name: string;
  occasion?: string;
  itemIds: string[];
  createdAt: string;
  updatedAt: string;
  /** Most recent wear timestamp (also mirrored in wearHistory) */
  lastWornAt?: string;
  /** Favorites float to the top of Outfits and get a Today boost */
  isPinned?: boolean;
};

export type WearHistoryEntry = {
  id: string;
  /** Present for outfit wears; omitted for solo item wears */
  outfitId?: string;
  /** Outfit name, or the item name for solo wears */
  outfitName: string;
  itemIds: string[];
  wornAt: string;
  occasion?: string;
  source?: 'outfit' | 'item';
};

export type StylistSuggestion = {
  id: string;
  title: string;
  occasion: string;
  itemIds: string[];
  /** Human-readable why this was suggested */
  reason: string;
  /** If based on a saved outfit */
  sourceOutfitId?: string;
};
