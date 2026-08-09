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
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  heightCm?: number;
  weightKg?: number;
  stylePreferences: string[];
};
